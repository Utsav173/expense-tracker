import { tool } from 'ai';
import { z } from 'zod';
import { transactionService } from '../../services/transaction.service';
import { HTTPException } from 'hono/http-exception';
import { parseISO, format } from 'date-fns';
import { InferInsertModel } from 'drizzle-orm';
import { Transaction } from '../../database/schema';
import { formatCurrency } from '../../utils/currency.utils';
import {
  createToolResponse,
  resolveAccountId,
  resolveCategoryId,
  resolveDateRangeForQuery,
  resolveSingleDate,
} from './shared';

export function createTransactionTools(userId: string) {
  return {
    addTransaction: tool({
      description:
        'Records a new financial transaction (income or expense) to a specified account.',
      parameters: z.object({
        amount: z.number().positive('The transaction amount (always positive).'),
        description: z.string().min(1).describe("Description (e.g., 'Groceries', 'Salary')."),
        type: z.enum(['income', 'expense']).describe("Type: 'income' or 'expense'."),
        accountIdentifier: z
          .string()
          .min(1)
          .describe('Name or ID of the account for the transaction.'),
        categoryIdentifier: z
          .string()
          .optional()
          .describe("Category name or ID (e.g., 'Food', 'Salary'). Optional."),
        dateDescription: z
          .string()
          .optional()
          .describe("Date (e.g., 'today', 'yesterday', '2024-03-15'). Defaults to today."),
        transferDetails: z.string().optional().describe('Source/recipient details (optional).'),
      }),
      execute: async ({
        amount,
        description,
        type,
        accountIdentifier,
        categoryIdentifier,
        dateDescription,
        transferDetails,
      }) => {
        try {
          const accountRes = await resolveAccountId(userId, accountIdentifier);
          if ('error' in accountRes)
            return createToolResponse({ success: false, error: accountRes.error });
          if ('clarificationNeeded' in accountRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which account do you mean?',
              options: accountRes.options,
            });

          let categoryId: string | undefined | null = null;
          if (categoryIdentifier) {
            const categoryRes = await resolveCategoryId(userId, categoryIdentifier);
            if ('error' in categoryRes)
              return createToolResponse({ success: false, error: categoryRes.error });
            if ('clarificationNeeded' in categoryRes)
              return createToolResponse({
                success: true,
                clarificationNeeded: true,
                message: 'Which category do you mean?',
                options: categoryRes.options,
              });
            categoryId = categoryRes.id;
          }

          const dateRes = await resolveSingleDate(dateDescription, true);
          if (dateRes.error) return createToolResponse({ success: false, error: dateRes.error });
          const transactionDate = dateRes.singleDate;

          const payload: InferInsertModel<typeof Transaction> = {
            account: accountRes.id,
            amount: amount,
            isIncome: type === 'income',
            text: description,
            category: categoryId,
            transfer: transferDetails,
            createdAt: transactionDate,
            owner: userId,
            createdBy: userId,
          };

          const result = await transactionService.createTransaction(userId, payload);
          return createToolResponse({
            success: true,
            message: `Transaction added.`,
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

    listTransactions: tool({
      description:
        'Lists transactions based on filters like account, category, date range, type, amount range, or text search.',
      parameters: z.object({
        accountIdentifier: z.string().optional().describe('Filter by account name or ID.'),
        categoryIdentifier: z.string().optional().describe('Filter by category name or ID.'),
        dateDescription: z
          .string()
          .optional()
          .describe(
            "Date range ('today', 'last 7 days', 'this month', 'last Tuesday', 'YYYY-MM-DD', 'YYYY-MM-DD,YYYY-MM-DD').",
          ),
        type: z.enum(['income', 'expense']).optional().describe("Filter by 'income' or 'expense'."),
        minAmount: z.number().optional().describe('Minimum amount.'),
        maxAmount: z.number().optional().describe('Maximum amount.'),
        searchText: z.string().optional().describe('Search text in description/transfer.'),
        limit: z.number().int().positive().optional().default(10).describe('Max results.'),
      }),
      execute: async ({
        accountIdentifier,
        categoryIdentifier,
        dateDescription,
        type,
        minAmount,
        maxAmount,
        searchText,
        limit = 10,
      }) => {
        try {
          let accountId: string | undefined = undefined;
          if (accountIdentifier) {
            const accountRes = await resolveAccountId(userId, accountIdentifier);
            if ('error' in accountRes)
              return createToolResponse({ success: false, error: accountRes.error });
            if ('clarificationNeeded' in accountRes)
              return createToolResponse({
                success: true,
                clarificationNeeded: true,
                message: 'Which account?',
                options: accountRes.options,
              });
            accountId = accountRes.id;
          }

          let categoryId: string | undefined = undefined;
          if (categoryIdentifier) {
            const categoryRes = await resolveCategoryId(userId, categoryIdentifier);
            if ('error' in categoryRes)
              return createToolResponse({ success: false, error: categoryRes.error });
            if ('clarificationNeeded' in categoryRes)
              return createToolResponse({
                success: true,
                clarificationNeeded: true,
                message: 'Which category?',
                options: categoryRes.options,
              });
            categoryId = categoryRes.id;
          }

          const dateRes = await resolveDateRangeForQuery(dateDescription, false);
          if (dateRes.error) return createToolResponse({ success: false, error: dateRes.error });

          const filters = {
            accountId: accountId ?? undefined,
            userId: accountId ? undefined : userId,
            duration: `${dateRes.startDate},${dateRes.endDate}`,
            q: searchText,
            isIncome: type === undefined ? undefined : String(type === 'income'),
            categoryId: categoryId ?? undefined,
            minAmount,
            maxAmount,
          };

          const result = await transactionService.getTransactions(
            filters,
            1,
            limit,
            'createdAt',
            'desc',
          );

          const message =
            result.transactions.length > 0
              ? `Found ${result.transactions.length} transaction(s).`
              : 'No transactions found.';
          return createToolResponse({ success: true, message: message, data: result.transactions });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyTransactionForAction: tool({
      description:
        'Finds potential transactions based on description/date/amount to identify ONE for a future update or deletion. Requires confirmation.',
      parameters: z.object({
        identifier: z
          .string()
          .min(3)
          .describe("Keywords to find the transaction (e.g., 'groceries yesterday')."),
        accountIdentifier: z.string().optional().describe('Account name or ID (optional).'),
        dateDescription: z
          .string()
          .optional()
          .describe("Approximate date or range (e.g., 'last week')."),
        amountHint: z.number().optional().describe('Approximate amount (optional).'),
      }),
      execute: async ({ identifier, accountIdentifier, dateDescription, amountHint }) => {
        try {
          let accountId: string | undefined = undefined;
          if (accountIdentifier) {
            const accountRes = await resolveAccountId(userId, accountIdentifier);
            if ('error' in accountRes)
              return createToolResponse({ success: false, error: accountRes.error });
            if ('clarificationNeeded' in accountRes)
              return createToolResponse({
                success: true,
                clarificationNeeded: true,
                message: 'Which account?',
                options: accountRes.options,
              });
            accountId = accountRes.id;
          }

          const dateRes = await resolveDateRangeForQuery(dateDescription, false);
          if (dateRes.error) return createToolResponse({ success: false, error: dateRes.error });

          const filters = {
            accountId: accountId ?? undefined,
            userId: accountId ? undefined : userId,
            q: identifier,
            duration: `${dateRes.startDate},${dateRes.endDate}`,
            minAmount: amountHint ? amountHint * 0.95 : undefined,
            maxAmount: amountHint ? amountHint * 1.05 : undefined,
          };

          const result = await transactionService.getTransactions(
            filters,
            1,
            5,
            'createdAt',
            'desc',
          );

          if (result.transactions.length === 0) {
            return createToolResponse({ success: false, error: 'No matching transaction found.' });
          }

          if (result.transactions.length > 1) {
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Found multiple transactions. Please specify which one by ID:',
              options: result.transactions.map((t) => ({
                id: t.id,
                details: `${
                  t.createdAt ? format(parseISO(String(t.createdAt)), 'yyyy-MM-dd') : 'N/A'
                }: ${t.text} (${t.isIncome ? '+' : '-'}${formatCurrency(t.amount, t.currency)})`,
              })),
            });
          }

          const tx = result.transactions[0];
          const details = `${
            tx.createdAt ? format(parseISO(String(tx.createdAt)), 'yyyy-MM-dd') : 'N/A'
          }: ${tx.text} (${tx.isIncome ? '+' : '-'}${formatCurrency(tx.amount, tx.currency)})`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: tx.id,
            details: details,
            message: `Found transaction: ${details}. Confirm the action (update or delete) and provide the ID (${tx.id})?`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateTransaction: tool({
      description:
        'Updates specific fields of a transaction AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        transactionId: z.string().describe('The exact unique ID of the transaction.'),
        newAmount: z.number().positive().optional().describe('Updated positive amount.'),
        newDescription: z.string().min(1).optional().describe('Updated description.'),
        newType: z.enum(['income', 'expense']).optional().describe('Updated type.'),
        newCategoryIdentifier: z
          .string()
          .optional()
          .describe('Updated category name or ID (or empty/null to remove).'),
        newDateDescription: z.string().optional().describe("Updated date (e.g., 'today')."),
        newTransferDetails: z.string().optional().describe('Updated transfer details.'),
      }),
      execute: async (updates) => {
        const { transactionId, ...newValues } = updates;
        try {
          const payload: Partial<InferInsertModel<typeof Transaction> & { createdAt: Date }> = {};
          if (newValues.newAmount !== undefined) payload.amount = newValues.newAmount;
          if (newValues.newDescription !== undefined) payload.text = newValues.newDescription;
          if (newValues.newType !== undefined) payload.isIncome = newValues.newType === 'income';
          if (newValues.newTransferDetails !== undefined)
            payload.transfer = newValues.newTransferDetails;

          if (newValues.newDateDescription !== undefined) {
            const dateRes = await resolveSingleDate(newValues.newDateDescription, false);
            if (dateRes.error || !dateRes.singleDate)
              return createToolResponse({
                success: false,
                error: dateRes.error || 'Invalid date for update.',
              });
            payload.createdAt = dateRes.singleDate;
          }

          if (newValues.newCategoryIdentifier !== undefined) {
            if (
              newValues.newCategoryIdentifier === null ||
              newValues.newCategoryIdentifier.trim() === ''
            ) {
              payload.category = null;
            } else {
              const categoryRes = await resolveCategoryId(userId, newValues.newCategoryIdentifier);
              if ('error' in categoryRes)
                return createToolResponse({ success: false, error: categoryRes.error });

              if ('clarificationNeeded' in categoryRes)
                return createToolResponse({
                  success: false,
                  error: `Multiple categories match "${newValues.newCategoryIdentifier}". Please be more specific.`,
                });
              payload.category = categoryRes.id;
            }
          }

          if (Object.keys(payload).length === 0) {
            return createToolResponse({
              success: false,
              error: 'No valid fields provided for update.',
            });
          }

          const result = await transactionService.updateTransaction(transactionId, userId, payload);
          return createToolResponse({
            success: true,
            message: `Transaction (ID: ${transactionId}) updated.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteTransaction: tool({
      description: 'Deletes a specific transaction AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        transactionId: z
          .string()
          .describe(
            'The exact unique ID of the transaction to delete (obtained from identification step).',
          ),
      }),
      execute: async ({ transactionId }) => {
        try {
          const result = await transactionService.deleteTransaction(transactionId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getExtremeTransaction: tool({
      description:
        'Finds and reports the highest or lowest income or expense transaction within a specified date range and optional account.',
      parameters: z.object({
        type: z
          .enum(['highest_income', 'lowest_income', 'highest_expense', 'lowest_expense'])
          .describe('The type of extreme transaction to find.'),
        dateDescription: z
          .string()
          .optional()
          .describe("Date range (e.g., 'this month', 'last year'). Defaults to all time."),
        accountIdentifier: z
          .string()
          .optional()
          .describe('Optional: Filter by account name or ID.'),
      }),
      execute: async ({ type, dateDescription, accountIdentifier }) => {
        try {
          let accountId: string | undefined = undefined;
          if (accountIdentifier) {
            const accountRes = await resolveAccountId(userId, accountIdentifier);
            if ('error' in accountRes)
              return createToolResponse({ success: false, error: accountRes.error });
            if ('clarificationNeeded' in accountRes)
              return createToolResponse({
                success: true,
                clarificationNeeded: true,
                message: 'Which account?',
                options: accountRes.options,
              });
            accountId = accountRes.id;
          }

          const transaction = await transactionService.getExtremeTransaction(
            userId,
            type,
            dateDescription,
            accountId,
          );

          if (!transaction) {
            return createToolResponse({ success: true, message: `No matching transaction found.` });
          }

          const typeLabel = type.replace(/_/g, ' ');
          const formattedAmount = formatCurrency(transaction.amount, transaction.currency);
          const formattedDate = transaction.createdAt
            ? format(new Date(transaction.createdAt), 'MMM d, yyyy')
            : 'N/A';
          const accountName = transaction.account?.name ?? 'N/A';
          const categoryName = transaction.category?.name ?? 'Uncategorized';

          return createToolResponse({
            success: true,
            message: `The ${typeLabel} transaction is "${transaction.text}" for ${formattedAmount} on ${formattedDate} in account "${accountName}" (Category: ${categoryName}).`,
            data: transaction,
          });
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
