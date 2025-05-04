import { tool } from 'ai';
import { z } from 'zod';
import { investmentAccountService } from '../../services/investmentAccount.service';
import { HTTPException } from 'hono/http-exception';
import { InferInsertModel, eq } from 'drizzle-orm';
import { InvestmentAccount } from '../../database/schema';
import { db } from '../../database';
import { createToolResponse, resolveInvestmentAccountId } from './shared';

export function createInvestmentAccountTools(userId: string) {
  return {
    createInvestmentAccount: tool({
      description: 'Creates a new account for tracking investments (e.g., brokerage account).',
      parameters: z.object({
        accountName: z.string().min(1).describe("Name for the account (e.g., 'Zerodha Stocks')."),
        platform: z.string().optional().describe("Broker/platform name (e.g., 'Zerodha')."),
        currency: z.string().length(3).describe('3-letter currency code (e.g., INR, USD).'),
      }),
      execute: async ({ accountName, platform, currency }) => {
        try {
          const payload = { name: accountName, platform, currency: currency.toUpperCase() };
          const newAccount = await investmentAccountService.createInvestmentAccount(
            userId,
            payload,
          );
          return createToolResponse({
            success: true,
            message: `Investment account "${newAccount.name}" created.`,
            data: newAccount,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listInvestmentAccounts: tool({
      description: "Lists the user's investment accounts.",
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await investmentAccountService.getInvestmentAccounts(
            userId,
            1,
            100,
            'name',
            'asc',
          );
          const message =
            result.data.length > 0
              ? `Found ${result.data.length} investment accounts.`
              : 'No investment accounts found.';
          return createToolResponse({ success: true, message: message, data: result.data });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyInvestmentAccountForAction: tool({
      description:
        'Identifies a specific investment account by name or ID for potential update or deletion. Requires confirmation.',
      parameters: z.object({
        accountIdentifier: z.string().min(1).describe('Name or ID of the investment account.'),
      }),
      execute: async ({ accountIdentifier }) => {
        try {
          const resolved = await resolveInvestmentAccountId(userId, accountIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which investment account?',
              options: resolved.options,
            });

          const account = await db.query.InvestmentAccount.findFirst({
            where: eq(InvestmentAccount.id, resolved.id),
            columns: { name: true, platform: true, currency: true },
          });
          const details = `Inv. Account: ${account?.name ?? accountIdentifier} (${
            account?.platform ?? 'N/A'
          }, ${account?.currency ?? 'N/A'})`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Confirm action (update name/platform or delete) and provide ID (${resolved.id})? Deleting removes all holdings.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateInvestmentAccount: tool({
      description:
        'Updates name or platform of an investment account AFTER confirmation, using its unique ID.',
      parameters: z.object({
        accountId: z.string().describe('Exact unique ID of the investment account.'),
        newName: z.string().min(1).optional().describe('New name (optional).'),
        newPlatform: z.string().min(1).optional().describe('New platform/broker (optional).'),
      }),
      execute: async ({ accountId, newName, newPlatform }) => {
        try {
          if (!newName && !newPlatform)
            return createToolResponse({
              success: false,
              error: 'No update field (newName or newPlatform) provided.',
            });
          const payload: Partial<
            Pick<InferInsertModel<typeof InvestmentAccount>, 'name' | 'platform'>
          > = {};
          if (newName) payload.name = newName;
          if (newPlatform) payload.platform = newPlatform;

          await investmentAccountService.updateInvestmentAccount(accountId, userId, payload);
          return createToolResponse({
            success: true,
            message: `Investment account (ID: ${accountId}) updated.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteInvestmentAccount: tool({
      description:
        'Deletes an investment account and all its holdings AFTER confirmation, using its unique ID.',
      parameters: z.object({
        accountId: z
          .string()

          .describe('Exact unique ID of the investment account to delete.'),
      }),
      execute: async ({ accountId }) => {
        try {
          const result = await investmentAccountService.deleteInvestmentAccount(accountId, userId);
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
