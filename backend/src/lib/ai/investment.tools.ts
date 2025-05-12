import { tool } from 'ai';
import { z } from 'zod';
import { investmentService } from '../../services/investment.service';
import { HTTPException } from 'hono/http-exception';
import { parseISO, format } from 'date-fns';
import { InferInsertModel, and, eq, ilike } from 'drizzle-orm';
import { Investment } from '../../database/schema';
import { db } from '../../database';
import { formatCurrency } from '../../utils/currency.utils';
import { createToolResponse, resolveInvestmentAccountId, resolveSingleDate } from './shared';

export function createInvestmentTools(userId: string) {
  return {
    addInvestment: tool({
      description:
        'Records a new investment holding (e.g., stock purchase) within a specific investment account. if purchase date is not provided, you can utilized "getHistoricalStockPriceOnDate" tools and fetch the price for that date.',
      parameters: z.object({
        investmentAccountIdentifier: z
          .string()
          .min(1)
          .describe('Name or ID of the investment account holding this investment.'),
        symbol: z
          .string()
          .min(1)
          .describe(
            "The stock ticker or mutual fund symbol (e.g., 'RELIANCE.NS', 'INFY'). if found symbol is not accruate, you can utilized 'searchStockSymbols' tools to get correct stock symbol.",
          ),
        shares: z.number().positive('Number of shares or units purchased.'),
        purchasePrice: z
          .number()
          .nonnegative()
          .describe(
            'Price per share/unit at purchase. if not provided, you can utilized "getHistoricalStockPriceOnDate" tools and fetch the price for that date.',
          ),
        purchaseDateDescription: z
          .string()
          .describe("Date of purchase (e.g., 'today', '2024-01-15')."),
      }),
      execute: async ({
        investmentAccountIdentifier,
        symbol,
        shares,
        purchasePrice,
        purchaseDateDescription,
      }) => {
        try {
          const accountRes = await resolveInvestmentAccountId(userId, investmentAccountIdentifier);
          if ('error' in accountRes)
            return createToolResponse({ success: false, error: accountRes.error });
          if ('clarificationNeeded' in accountRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which investment account?',
              options: accountRes.options,
            });

          const dateRes = await resolveSingleDate(purchaseDateDescription, true);
          if (dateRes.error || !dateRes.singleDate)
            return createToolResponse({
              success: false,
              error: dateRes.error || 'Invalid purchase date.',
            });

          const payload = {
            account: accountRes.id,
            symbol: symbol.toUpperCase(),
            shares,
            purchasePrice,
            purchaseDate: dateRes.singleDate.toISOString(),
          };
          const result = await investmentService.createInvestment(userId, payload as any);
          return createToolResponse({
            success: true,
            message: `Added ${shares} units of ${symbol}.`,
            data: result.data,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listInvestments: tool({
      description: 'Lists investments held within a specific investment account.',
      parameters: z.object({
        investmentAccountIdentifier: z
          .string()
          .min(1)
          .describe('Name or ID of the investment account.'),
        limit: z.number().int().positive().optional().default(20).describe('Max results.'),
      }),
      execute: async ({ investmentAccountIdentifier, limit = 20 }) => {
        try {
          const accountRes = await resolveInvestmentAccountId(userId, investmentAccountIdentifier);
          if ('error' in accountRes)
            return createToolResponse({ success: false, error: accountRes.error });
          if ('clarificationNeeded' in accountRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which investment account?',
              options: accountRes.options,
            });

          const result = await investmentService.getInvestmentsForAccount(
            accountRes.id,
            userId,
            1,
            limit,
            'symbol',
            'asc',
          );
          const message =
            result.data.length > 0
              ? `Found ${result.data.length} investments.`
              : 'No investments found.';
          return createToolResponse({ success: true, message: message, data: result.data });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyInvestmentForAction: tool({
      description:
        'Identifies a specific investment holding by symbol within an account for potential update or deletion. Requires confirmation.',
      parameters: z.object({
        investmentAccountIdentifier: z
          .string()
          .min(1)
          .describe('Name or ID of the investment account.'),
        symbol: z.string().min(1).describe('Stock ticker or fund symbol.'),
      }),
      execute: async ({ investmentAccountIdentifier, symbol }) => {
        try {
          const accountRes = await resolveInvestmentAccountId(userId, investmentAccountIdentifier);
          if ('error' in accountRes)
            return createToolResponse({ success: false, error: accountRes.error });
          if ('clarificationNeeded' in accountRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which investment account?',
              options: accountRes.options,
            });

          const investments = await db.query.Investment.findMany({
            where: and(
              eq(Investment.account, accountRes.id),
              ilike(Investment.symbol, `%${symbol.trim().toUpperCase()}%`),
            ),
            columns: {
              id: true,
              symbol: true,
              shares: true,
              purchasePrice: true,
              purchaseDate: true,
            },
            limit: 5,
          });

          if (investments.length === 0)
            return createToolResponse({
              success: false,
              error: `Investment with symbol like "${symbol}" not found in this account.`,
            });

          if (investments.length > 1) {
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: `Found multiple investments for "${symbol}". Please specify which one by ID:`,
              options: investments.map((i) => ({
                id: i.id,
                details: `${i.symbol}: ${i.shares} units @ ${formatCurrency(i.purchasePrice)} on ${
                  i.purchaseDate ? format(parseISO(String(i.purchaseDate)), 'yyyy-MM-dd') : 'N/A'
                }`,
              })),
            });
          }

          const inv = investments[0];
          const details = `${inv.symbol}: ${inv.shares} units @ ${formatCurrency(
            inv.purchasePrice,
          )} on ${
            inv.purchaseDate ? format(parseISO(String(inv.purchaseDate)), 'yyyy-MM-dd') : 'N/A'
          }`;
          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: inv.id,
            details: details,
            message: `Found ${details}. Confirm action (update purchase details/dividend or delete) and provide ID (${inv.id})?`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateInvestment: tool({
      description:
        'Updates purchase details (shares, price, date) of an investment AFTER confirmation, using its unique ID.',
      parameters: z.object({
        investmentId: z.string().describe('Exact unique ID of the investment.'),
        newShares: z.number().positive().optional().describe('New number of shares (optional).'),
        newPurchasePrice: z
          .number()
          .nonnegative()
          .optional()
          .describe('New purchase price per share (optional).'),
        newPurchaseDateDescription: z
          .string()
          .optional()
          .describe("New purchase date (e.g., '2024-02-10') (optional)."),
      }),
      execute: async ({
        investmentId,
        newShares,
        newPurchasePrice,
        newPurchaseDateDescription,
      }) => {
        try {
          const payload: Partial<
            Pick<InferInsertModel<typeof Investment>, 'shares' | 'purchasePrice' | 'purchaseDate'>
          > = {};
          if (newShares !== undefined) payload.shares = newShares;
          if (newPurchasePrice !== undefined) payload.purchasePrice = newPurchasePrice;
          if (newPurchaseDateDescription !== undefined) {
            const dateRes = await resolveSingleDate(newPurchaseDateDescription, false);
            if (dateRes.error || !dateRes.singleDate)
              return createToolResponse({
                success: false,
                error: dateRes.error || 'Invalid date for update.',
              });
            payload.purchaseDate = new Date(dateRes.singleDate.toISOString());
          }

          if (Object.keys(payload).length === 0)
            return createToolResponse({
              success: false,
              error: 'No valid update fields provided.',
            });

          await investmentService.updateInvestment(investmentId, userId, payload);
          return createToolResponse({
            success: true,
            message: `Investment (ID: ${investmentId}) purchase details updated.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateDividend: tool({
      description:
        'Updates the total dividend received for an investment AFTER confirmation, using its unique ID.',
      parameters: z.object({
        investmentId: z.string().describe('Exact unique ID of the investment.'),
        newTotalDividend: z.number().nonnegative().describe('New total dividend amount received.'),
      }),
      execute: async ({ investmentId, newTotalDividend }) => {
        try {
          await investmentService.updateInvestmentDividend(investmentId, userId, newTotalDividend);
          return createToolResponse({
            success: true,
            message: `Investment (ID: ${investmentId}) dividend updated.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteInvestment: tool({
      description: 'Deletes a specific investment holding AFTER confirmation, using its unique ID.',
      parameters: z.object({
        investmentId: z.string().describe('Exact unique ID of the investment to delete.'),
      }),
      execute: async ({ investmentId }) => {
        try {
          const result = await investmentService.deleteInvestment(investmentId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),
  };
}
