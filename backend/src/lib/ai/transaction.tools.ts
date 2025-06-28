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
        'Records a new financial transaction (income or expense). Account, category, and date can be inferred if not provided.',
      parameters: z.object({
        amount: z.number().positive('The transaction amount (always positive). Example: 50.75'),
        description: z.string().min(1).describe("Description (e.g., 'Groceries', 'Salary'). Example: "Coffee at Starbucks""),
        type: z.enum(['income', 'expense']).describe("Type: 'income' or 'expense'. Example: "expense""),
        accountIdentifier: z
          .string()
          .optional()
          .describe("Optional: Name or ID of the account. Defaults to user's default account. Example: "Cash" or "acc_123""),
        categoryIdentifier: z
          .string()
          .optional()
          .describe(
            'Optional: Category name or ID. AI will try to infer from description if omitted. Example: "Food" or "cat_456"',
          ),
        dateDescription: z
          .string()
          .optional()
          .describe(
            "Optional: Date (e.g., 'today', 'yesterday', '2024-03-15'). Defaults to today. Example: "last Friday" or "2024-07-01""),
        transferDetails: z.string().optional().describe('Optional: Source/recipient details. Example: "From John Doe" or "To Utility Company"'),
        mentionedCurrency: z
          .string()
          .length(3)
          .optional()
          .describe('Optional: 3-letter currency code if mentioned by user (e.g., USD, EUR). Example: "USD"'),
      }),
      execute: async ({
        amount,
        description,
        type,
        accountIdentifier,
        categoryIdentifier,
        dateDescription,
        transferDetails,
        mentionedCurrency,
      }) => {
        try {
          const accountRes = await resolveAccountId(userId, accountIdentifier);
          if ('error' in accountRes)
            return createToolResponse({ success: false, error: accountRes.error });
          if ('clarificationNeeded' in accountRes) {
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: `Which account should I use for "${description}"?`,
              options: accountRes.options,
            });
          }
          const resolvedAccountId = accountRes.id;
          const accountName = accountRes.name || 'the selected account';
          const accountCurrency = accountRes.currency || 'INR';

          if (
            mentionedCurrency &&
            mentionedCurrency.toUpperCase() !== accountCurrency.toUpperCase()
          ) {
            return createToolResponse({
              success: false,
              clarificationNeeded: true,
              error: `You mentioned ${mentionedCurrency}, but ${accountName} is in ${accountCurrency}. Please clarify which currency to use or choose a different account.`,
              options: [
                { id: 'use_account_currency', name: `Use ${accountCurrency} (account's currency)` },
                { id: 'change_account', name: 'Choose a different account' },
              ],
            });
          }

          const categoryRes = await resolveCategoryId(userId, categoryIdentifier, description);
          let resolvedCategoryId: string | null = null;
          let categoryName = 'Uncategorized';
          let categoryClarificationMessage: string | undefined = undefined;

          if ('error' in categoryRes) {
            categoryClarificationMessage = categoryRes.error;
          } else if ('clarificationNeeded' in categoryRes) {
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: `Which category for "${description}"?`,
              options: categoryRes.options,
            });
          } else {
            resolvedCategoryId = categoryRes.id;
            categoryName = categoryRes.name || 'Uncategorized';
          }

          const dateRes = await resolveSingleDate(dateDescription, true);
          if (dateRes.error || !dateRes.singleDate) {
            return createToolResponse({
              success: false,
              error: dateRes.error || 'Invalid transaction date.',
            });
          }
          const transactionDate = dateRes.singleDate;
          const dateUsed = dateDescription ? format(transactionDate, 'MMM d, yyyy') : 'today';

          const payload: InferInsertModel<typeof Transaction> = {
            account: resolvedAccountId,
            amount: amount,
            isIncome: type === 'income',
            text: description,
            category: resolvedCategoryId,
            transfer: transferDetails,
            createdAt: transactionDate,
            owner: userId,
            createdBy: userId,
            currency: accountCurrency,
          };

          const result = await transactionService.createTransaction(userId, payload);

          let successMessage = `Transaction added: ${type} of ${formatCurrency(
            amount,
            accountCurrency,
          )} for "${description}" to account "${accountName}" on ${dateUsed}.`;
          if (resolvedCategoryId) {
            successMessage += ` Categorized as "${categoryName}".`;
          } else if (categoryClarificationMessage) {
            successMessage += ` ${categoryClarificationMessage} You can categorize it later.`;
          } else {
            successMessage += ` Please categorize it if needed.`;
          }

          return createToolResponse({
            success: true,
            message: successMessage,
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
        accountIdentifier: z.string().optional().describe('Filter by account name or ID. Example: "Savings" or "acc_789"'),
        categoryIdentifier: z.string().optional().describe('Filter by category name or ID. Example: "Utilities" or "cat_abc"'),
        dateDescription: z
          .string()
          .optional()
          .describe(
            "Date range ('today', 'last 7 days', 'this month', 'last Tuesday', 'YYYY-MM-DD', 'YYYY-MM-DD,YYYY-MM-DD'). Defaults to 'this month' if unspecified. Example: "last month" or "2024-01-01,2024-01-31"
          ),
        type: z
          .enum(['income', 'expense', 'all'])
          .optional()
          .describe("Filter by 'income', 'expense', or 'all'. Defaults to 'all'. Example: "expense""),
        minAmount: z.number().optional().describe('Minimum amount. Example: 100'),
        maxAmount: z.number().optional().describe('Maximum amount. Example: 500'),
        searchText: z.string().optional().describe('Search text in description/transfer. Example: "coffee" or "rent payment"'),
        limit: z.number().int().positive().optional().default(10).describe('Max results. Example: 5'),
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
            const categoryRes = await resolveCategoryId(userId, categoryIdentifier, searchText);
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

          const effectiveDateDescription = dateDescription || 'this month';
          const dateRes = await resolveDateRangeForQuery(effectiveDateDescription, true);
          if (dateRes.error) return createToolResponse({ success: false, error: dateRes.error });

          const filters = {
            accountId: accountId ?? undefined,
            userId: accountId ? undefined : userId,
            duration:
              dateRes.startDate && dateRes.endDate
                ? `${format(dateRes.startDate, 'yyyy-MM-dd')},${format(
                    dateRes.endDate,
                    'yyyy-MM-dd',
                  )}`
                : undefined,
            q: searchText,
            isIncome: type === 'all' || type === undefined ? undefined : String(type === 'income'),
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
          .describe("Keywords to find the transaction (e.g., 'groceries yesterday'). Example: "Starbucks coffee" or "electricity bill""),
        accountIdentifier: z.string().optional().describe('Account name or ID (optional). Example: "Checking" or "acc_123"'),
        dateDescription: z
          .string()
          .optional()
          .describe("Approximate date or range (e.g., 'last week'). Example: "yesterday" or "last month""),
        amountHint: z.number().optional().describe('Approximate amount (optional). Example: 25.50'),
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
        transactionId: z.string().describe('The exact unique ID of the transaction. Example: "txn_abc123"'),
        newAmount: z.number().positive().optional().describe('Updated positive amount. Example: 60.00'),
        newDescription: z.string().min(1).optional().describe('Updated description. Example: "Updated coffee expense"'),
        newType: z.enum(['income', 'expense']).optional().describe('Updated type. Example: "income"'),
        newCategoryIdentifier: z
          .string()
          .optional()
          .describe('Updated category name or ID (or empty/null to remove). Example: "Dining Out" or "cat_456"'),
        newDateDescription: z.string().optional().describe("Updated date (e.g., 'today'). Example: "tomorrow" or "2024-07-15""),
        newTransferDetails: z.string().optional().describe('Updated transfer details. Example: "From Jane Doe"'),
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
            'The exact unique ID of the transaction to delete (obtained from identification step). Example: "txn_def456"',
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
          .describe('The type of extreme transaction to find. Example: "highest_expense"'),
        dateDescription: z
          .string()
          .optional()
          .describe("Date range (e.g., 'this month', 'last year'). Defaults to all time. Example: "this quarter" or "2023-01-01,2023-12-31""),
        accountIdentifier: z
          .string()
          .optional()
          .describe('Optional: Filter by account name or ID. Example: "Main Account" or "acc_789"'),
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
