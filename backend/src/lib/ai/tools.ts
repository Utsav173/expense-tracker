import { tool } from 'ai';
import { z } from 'zod';
import { accountService } from '../../services/account.service';
import { categoryService } from '../../services/category.service';
import { transactionService } from '../../services/transaction.service';
import { parseNaturalLanguageDateRange } from '../../utils/nl_date.utils';
import { HTTPException } from 'hono/http-exception';
import {
  format as formatDateFn,
  subDays,
  parse as parseDateFn,
  isValid as isValidDateFn,
  getYear,
  subMonths,
  getMonth,
  parseISO,
  format,
  startOfDay,
} from 'date-fns';
import { InferInsertModel, and, eq, ilike, or, sql } from 'drizzle-orm';
import {
  Transaction,
  Category,
  Budget,
  SavingGoal,
  Investment,
  User,
  Debts,
  InvestmentAccount,
} from '../../database/schema';
import { db } from '../../database';
import { goalService } from '../../services/goal.service';
import { budgetService } from '../../services/budget.service';
import { debtService } from '../../services/debt.service';
import { investmentAccountService } from '../../services/investmentAccount.service';
import { investmentService } from '../../services/investment.service';
import { formatCurrency } from '../../utils/currency.utils';

function safeFormatDate(date: Date | string | null | undefined, formatString: string): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValidDateFn(dateObj) ? format(dateObj, formatString) : 'N/A';
}

function parseDateDescription(dateDescription: string | undefined | null): Date {
  const now = new Date();
  if (!dateDescription) return now;
  const lowerDesc = dateDescription.toLowerCase().trim();

  // Handle simple relative terms
  if (lowerDesc === 'today') return startOfDay(now);
  if (lowerDesc === 'yesterday') return startOfDay(subDays(now, 1));

  // Try parsing YYYY-MM-DD
  try {
    const parsedDate = parseDateFn(dateDescription, 'yyyy-MM-dd', new Date());
    if (isValidDateFn(parsedDate)) {
      return startOfDay(parsedDate);
    }
  } catch (e) {
    /* ignore */
  }

  // Try parsing natural language ranges and return the start date if valid
  const range = parseNaturalLanguageDateRange(dateDescription);
  if (range?.startDate && isValidDateFn(range.startDate)) {
    return startOfDay(range.startDate);
  }

  console.warn(
    `Could not parse single date description: "${dateDescription}", defaulting to today.`,
  );
  return startOfDay(now); // Default to start of today
}

async function findAccountIdByName(userId: string, accountName: string): Promise<string | null> {
  if (!accountName || !accountName.trim()) return null;
  try {
    const accounts = await accountService.getAccountListSimple(userId);
    const foundAccount = accounts.find(
      (acc) => acc.name.toLowerCase() === accountName.trim().toLowerCase(),
    );
    return foundAccount?.id ?? null;
  } catch (error) {
    console.error(`Error finding account ID for name "${accountName}":`, error);
    return null;
  }
}

async function findCategoryIdByName(userId: string, categoryName: string): Promise<string | null> {
  if (!categoryName || !categoryName.trim()) return null;
  try {
    const category = await db.query.Category.findFirst({
      where: and(ilike(Category.name, categoryName.trim()), eq(Category.owner, userId)),
      columns: { id: true },
    });
    return category?.id ?? null;
  } catch (error) {
    console.error(`Error finding category ID for name "${categoryName}":`, error);
    return null;
  }
}

async function findInvestmentAccountIdByName(
  userId: string,
  invAccountName: string,
): Promise<string | null> {
  if (!invAccountName || !invAccountName.trim()) return null;
  try {
    const account = await db.query.InvestmentAccount.findFirst({
      where: and(
        ilike(InvestmentAccount.name, invAccountName.trim()),
        eq(InvestmentAccount.userId, userId),
      ),
      columns: { id: true },
    });
    return account?.id ?? null;
  } catch (error) {
    console.error(`Error finding investment account ID for name "${invAccountName}":`, error);
    return null;
  }
}

async function findDebtId(
  userId: string,
  identifier: string,
): Promise<{ id: string; details: string } | null> {
  try {
    // Ensure 'q' filter expects string | undefined
    const { data: debts } = await debtService.getDebts(
      userId,
      { q: identifier || undefined }, // Pass undefined if empty
      1,
      5,
      'createdAt',
      'desc',
    );

    if (debts.length === 1) {
      const d = debts[0].debts;
      const involvedUser = await db.query.User.findFirst({
        where: eq(User.id, d.userId),
        columns: { name: true },
      });
      const details = `${d.type} ${formatCurrency(d.amount)} involving ${
        involvedUser?.name ?? 'Unknown User'
      } (${
        // Use formatCurrency
        d.description ?? 'No description'
      })`;
      return { id: d.id, details };
    }

    if (debts.length > 1) {
      console.warn(`Debt search for "${identifier}" yielded multiple results.`);
      return null; // Indicate ambiguity or multiple matches
    }
    return null; // No matches found
  } catch (error) {
    console.error(`Error finding debt ID for identifier "${identifier}":`, error);
    return null;
  }
}

async function findGoalIdByName(
  userId: string,
  goalName: string,
): Promise<{ id: string; name: string } | null> {
  if (!goalName || !goalName.trim()) return null;
  try {
    const goal = await db.query.SavingGoal.findFirst({
      where: and(ilike(SavingGoal.name, `%${goalName.trim()}%`), eq(SavingGoal.userId, userId)),
      columns: { id: true, name: true },
    });
    return goal ? { id: goal.id, name: goal.name } : null;
  } catch (error) {
    console.error(`Error finding goal ID for name "${goalName}":`, error);
    return null;
  }
}

const createJsonResponse = (result: any): string => {
  return JSON.stringify(result);
};

export function createAccountTools(userId: string) {
  return {
    createAccount: tool({
      description: 'Creates a new bank account, wallet, or financial account for the user.',
      parameters: z.object({
        accountName: z.string().min(1).describe('The desired name for the new account.'),
        initialBalance: z
          .number()
          .optional()
          .describe('The starting balance (defaults to 0 if not provided).'),
        currency: z
          .string()
          .length(3)
          .optional()
          .describe(
            "The 3-letter currency code (e.g., INR, USD). Defaults to user's preferred currency or INR.",
          ),
      }),
      execute: async ({ accountName, initialBalance = 0, currency }) => {
        try {
          const result = await accountService.createAccount(
            userId,
            accountName,
            initialBalance,
            currency?.toUpperCase() || 'INR',
          );
          const response = {
            success: true,
            message: result.message,
            data: {
              id: result.data.id,
              name: result.data.name,
              balance: result.data.balance,
              currency: result.data.currency,
            },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create account: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    listAccounts: tool({
      description:
        "Lists the user's financial accounts, optionally filtering by name. Shows balances by default.",
      parameters: z.object({
        searchName: z
          .string()
          .optional()
          .describe('Filter accounts whose name contains this text.'),
      }),
      execute: async ({ searchName }) => {
        try {
          const { accounts } = await accountService.getAccountList(
            userId,
            1,
            100,
            'name',
            'asc',
            searchName || '',
          );
          const message =
            accounts.length > 0
              ? `Found ${accounts.length} account(s)${
                  searchName ? ` matching "${searchName}"` : ''
                }.`
              : searchName
              ? `No accounts found matching "${searchName}".`
              : 'No accounts found.';
          const response = {
            success: true,
            message: message,
            data: accounts.map((acc) => ({
              id: acc.id,
              name: acc.name,
              balance: acc.balance,
              currency: acc.currency,
            })),
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list accounts: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    getAccountBalance: tool({
      description: 'Retrieves the current balance for a specific account.',
      parameters: z.object({
        accountName: z
          .string()
          .min(1)
          .describe('The name of the account to check the balance for.'),
      }),
      execute: async ({ accountName }) => {
        try {
          const accountId = await findAccountIdByName(userId, accountName);
          if (!accountId)
            throw new HTTPException(404, { message: `Account named "${accountName}" not found.` });
          const account = await accountService.getAccountById(accountId, userId);
          const response = {
            success: true,
            message: `Balance for ${account.name} is ${account.balance ?? 0} ${account.currency}.`,
            data: {
              id: account.id,
              name: account.name,
              balance: account.balance,
              currency: account.currency,
            },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to get balance: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    identifyAccountForDeletion: tool({
      description:
        'Identifies an account for deletion based on its name. User confirmation is required before actual deletion.',
      parameters: z.object({
        accountName: z
          .string()
          .min(1)
          .describe('The exact name of the account to identify for potential deletion.'),
      }),
      execute: async ({ accountName }) => {
        try {
          const accountId = await findAccountIdByName(userId, accountName);
          if (!accountId)
            throw new HTTPException(404, { message: `Account named "${accountName}" not found.` });
          const response = {
            success: true,
            confirmationNeeded: true,
            id: accountId,
            details: `Account: ${accountName}`,
            message: `Are you sure you want to delete the account "${accountName}" (ID: ${accountId})? This action will remove all its transactions and cannot be undone. Please confirm by including the ID.`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to identify account: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeConfirmedDeleteAccount: tool({
      description:
        'Deletes a specific financial account and all its data AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        accountId: z.string().describe('The unique ID of the account to delete.'),
      }),
      execute: async ({ accountId }) => {
        try {
          const result = await accountService.deleteAccount(accountId, userId);
          const response = { success: true, message: result.message };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete account: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeUpdateAccountNameById: tool({
      description: 'Updates the name of an existing financial account using its specific ID.',
      parameters: z.object({
        accountId: z.string().describe('The unique ID of the account to rename.'),
        newAccountName: z.string().min(1).describe('The desired new name for the account.'),
      }),
      execute: async ({ accountId, newAccountName }) => {
        try {
          await accountService.updateAccount(
            accountId,
            userId,
            newAccountName,
            undefined,
            undefined,
          );
          const response = {
            success: true,
            message: `Account (ID: ${accountId}) renamed to "${newAccountName}".`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to rename account: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
  };
}

export function createCategoryTools(userId: string) {
  return {
    createCategory: tool({
      description: 'Creates a new custom category for classifying income or expenses.',
      parameters: z.object({
        categoryName: z.string().min(1).describe('The name for the new category.'),
      }),
      execute: async ({ categoryName }) => {
        try {
          const newCategory = await categoryService.createCategory(userId, categoryName);
          const response = {
            success: true,
            message: `Category "${newCategory.name}" created.`,
            data: { id: newCategory.id, name: newCategory.name },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create category: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    listCategories: tool({
      description:
        'Lists all available categories for the user (shared and custom). Optionally filters by name.',
      parameters: z.object({
        searchName: z
          .string()
          .optional()
          .describe('Filter categories whose name contains this text.'),
      }),
      execute: async ({ searchName }) => {
        try {
          const { categories } = await categoryService.getCategories(
            userId,
            1,
            500,
            searchName || '',
            'name',
            'asc',
          );
          const message =
            categories.length > 0
              ? `Found ${categories.length} categories${
                  searchName ? ` matching "${searchName}"` : ''
                }.`
              : searchName
              ? `No categories found matching "${searchName}".`
              : 'No categories found.';
          const response = {
            success: true,
            message: message,
            data: categories.map((c) => ({ id: c.id, name: c.name })),
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list categories: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    identifyCategoryForDeletion: tool({
      description:
        'Identifies a custom category for deletion based on its name. Cannot delete categories with transactions. User confirmation required.',
      parameters: z.object({
        categoryName: z
          .string()
          .min(1)
          .describe('The exact name of the custom category to identify for potential deletion.'),
      }),
      execute: async ({ categoryName }) => {
        try {
          const category = await db.query.Category.findFirst({
            where: and(ilike(Category.name, categoryName), eq(Category.owner, userId)),
            columns: { id: true },
          });
          if (!category)
            throw new HTTPException(404, {
              message: `Custom category named "${categoryName}" not found.`,
            });

          const transactionCheck = await db
            .select({ count: sql`count(*)` })
            .from(Transaction)
            .where(and(eq(Transaction.category, category.id), eq(Transaction.owner, userId)));
          if (Number(transactionCheck[0].count) > 0) {
            throw new HTTPException(400, {
              message: `Cannot delete category "${categoryName}" as it has associated transactions. Please reassign them first.`,
            });
          }
          const response = {
            success: true,
            confirmationNeeded: true,
            id: category.id,
            details: `Category: ${categoryName}`,
            message: `Are you sure you want to delete the category "${categoryName}" (ID: ${category.id})? This cannot be undone. Please confirm by including the ID.`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to identify category: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeConfirmedDeleteCategory: tool({
      description:
        'Deletes a specific custom category AFTER user confirmation, using its unique ID. Fails if transactions are associated.',
      parameters: z.object({
        categoryId: z.string().describe('The unique ID of the custom category to delete.'),
      }),
      execute: async ({ categoryId }) => {
        try {
          const result = await categoryService.deleteCategory(categoryId, userId);
          const response = { success: true, message: result.message };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete category: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeUpdateCategoryNameById: tool({
      description:
        'Updates the name of an existing custom category using its specific ID. Cannot rename shared/default categories.',
      parameters: z.object({
        categoryId: z.string().describe('The unique ID of the custom category to rename.'),
        newCategoryName: z.string().min(1).describe('The desired new name.'),
      }),
      execute: async ({ categoryId, newCategoryName }) => {
        try {
          await categoryService.updateCategory(categoryId, userId, newCategoryName);
          const response = {
            success: true,
            message: `Category (ID: ${categoryId}) renamed to "${newCategoryName}".`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to rename category: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
  };
}

export function createTransactionTools(userId: string) {
  type TransactionFiltersForAI = {
    accountId?: string;
    userId?: string;
    duration?: string;
    q?: string;
    isIncome?: string;
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
  };

  return {
    addTransaction: tool({
      description:
        'Records a new financial transaction (income or expense) to a specified account. Can optionally include category, date, and transfer details.',
      parameters: z.object({
        amount: z
          .number()
          .positive('Amount must be positive.')
          .describe('The monetary value of the transaction (always a positive number).'),
        description: z
          .string()
          .min(1)
          .describe("A brief text description (e.g., 'Groceries', 'Salary')."),
        type: z.enum(['income', 'expense']).describe("Specify 'income' or 'expense'."),
        accountName: z.string().min(1).describe('Name of the account for the transaction.'),
        categoryName: z
          .string()
          .optional()
          .describe("Category name (e.g., 'Groceries', 'Salary'). Optional."),
        date: z
          .string()
          .optional()
          .describe("Date (e.g., 'today', 'yesterday', '2024-03-15'). Defaults to today."),
        transferDetails: z
          .string()
          .optional()
          .describe('Source (for income) or recipient (for expense) details. Optional.'),
      }),
      execute: async ({
        amount,
        description,
        type,
        accountName,
        categoryName,
        date,
        transferDetails,
      }) => {
        try {
          const accountId = await findAccountIdByName(userId, accountName);
          if (!accountId)
            throw new HTTPException(404, { message: `Account "${accountName}" not found.` });
          const categoryId = categoryName ? await findCategoryIdByName(userId, categoryName) : null;
          if (categoryName && !categoryId)
            throw new HTTPException(404, { message: `Category "${categoryName}" not found.` });

          const transactionDate = parseDateDescription(date);

          const payload: InferInsertModel<typeof Transaction> = {
            account: accountId,
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
          const response = {
            success: true,
            message: `Transaction added to ${accountName}.`,
            data: { id: result.data.id, text: result.data.text, amount: result.data.amount },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to add transaction: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    listTransactions: tool({
      description:
        'Lists transactions based on filters like account, category, date range, type, amount range, or text search.',
      parameters: z.object({
        accountName: z.string().optional().describe('Filter by account name.'),
        categoryName: z.string().optional().describe('Filter by category name.'),
        dateRange: z
          .string()
          .optional()
          .describe(
            "Date range ('today', 'last 7 days', 'this month', 'last month', 'this year', 'last year', 'YYYY-MM-DD', 'YYYY-MM-DD,YYYY-MM-DD').",
          ),
        type: z.enum(['income', 'expense']).optional().describe("Filter by 'income' or 'expense'."),
        minAmount: z.number().optional().describe('Minimum transaction amount (inclusive).'),
        maxAmount: z.number().optional().describe('Maximum transaction amount (inclusive).'),
        searchText: z
          .string()
          .optional()
          .describe('Search text in description or transfer details.'),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .default(10)
          .describe('Max number of transactions to return (default 10).'),
      }),
      execute: async ({
        accountName,
        categoryName,
        dateRange,
        type,
        minAmount,
        maxAmount,
        searchText,
        limit = 10,
      }) => {
        try {
          const accountId = accountName
            ? await findAccountIdByName(userId, accountName)
            : undefined;
          if (accountName && !accountId)
            throw new HTTPException(404, { message: `Account "${accountName}" not found.` });
          const categoryId = categoryName
            ? await findCategoryIdByName(userId, categoryName)
            : undefined;
          if (categoryName && !categoryId)
            throw new HTTPException(404, { message: `Category "${categoryName}" not found.` });

          const filters: TransactionFiltersForAI = {
            accountId: accountId ?? undefined,
            userId: accountId ? undefined : userId,
            duration: dateRange,
            q: searchText,
            isIncome: type === undefined ? undefined : type === 'income' ? 'true' : 'false', // Convert to string
            categoryId: categoryId ?? undefined,
            minAmount: minAmount,
            maxAmount: maxAmount,
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
              ? `Found ${result.transactions.length} of ${result.pagination.total} transaction(s) matching criteria.`
              : 'No transactions found matching the criteria.';
          const response = {
            success: true,
            message: message,
            data: result.transactions.map((t) => ({
              id: t.id,
              date: t.createdAt,
              text: t.text,
              amount: t.amount,
              type: t.isIncome ? 'income' : 'expense',
              category: t.category?.name,
            })),
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list transactions: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    findTransactionForUpdateOrDelete: tool({
      description:
        'Finds potential transactions based on description/date/amount to identify ONE for a future update or deletion. Returns matches for user clarification.',
      parameters: z.object({
        identifier: z
          .string()
          .min(3)
          .describe(
            "Keywords to find the transaction (e.g., 'groceries yesterday', 'salary last month', 'coffee 50 rupees'). Be specific.",
          ),
        accountName: z
          .string()
          .optional()
          .describe('Account name to narrow down search (optional).'),
        dateHint: z
          .string()
          .optional()
          .describe("Approximate date if known (e.g., 'today', '2024-08-15')."),
        amountHint: z.number().optional().describe('Approximate amount if known.'),
      }),
      execute: async ({ identifier, accountName, dateHint, amountHint }) => {
        try {
          const accountId = accountName
            ? await findAccountIdByName(userId, accountName)
            : undefined;
          if (accountName && !accountId)
            throw new HTTPException(404, { message: `Account "${accountName}" not found.` });

          const filters: TransactionFiltersForAI = {
            accountId: accountId ?? undefined,
            userId: accountId ? undefined : userId,
            q: identifier,
            duration: dateHint
              ? formatDateFn(parseDateDescription(dateHint), 'yyyy-MM-dd,yyyy-MM-dd')
              : undefined,
          };
          if (amountHint !== undefined) {
            filters.minAmount = amountHint * 0.95;
            filters.maxAmount = amountHint * 1.05;
          }

          const result = await transactionService.getTransactions(
            filters,
            1,
            5,
            'createdAt',
            'desc',
          );

          if (result.transactions.length === 0) {
            throw new HTTPException(404, {
              message: `No transactions found matching "${identifier}"${
                accountName ? ` in account "${accountName}"` : ''
              }. Try being more specific.`,
            });
          }

          const formattedTransactions = result.transactions.map((t, index) => ({
            index: index + 1,
            id: t.id,
            details: `${
              t.createdAt ? formatDateFn(parseISO(t.createdAt.toISOString()), 'yyyy-MM-dd') : 'N/A'
            }: ${t.text} (${t.isIncome ? '+' : '-'}${t.amount} ${t.currency})`,
          }));

          if (result.transactions.length > 1) {
            const optionsText = formattedTransactions
              .map((t) => `${t.index}. ${t.details} (ID: ${t.id})`)
              .join('\n');
            const response = {
              success: true,
              clarificationNeeded: true,
              message: `Found multiple transactions matching "${identifier}". Please specify which one to modify/delete by its ID or number:\n${optionsText}`,
              data: formattedTransactions.map((t) => ({ id: t.id, details: t.details })),
            };
            return createJsonResponse(response);
          }

          const tx = result.transactions[0];
          const response = {
            success: true,
            confirmationNeeded: true,
            id: tx.id,
            details: formattedTransactions[0].details,
            message: `Found transaction (ID: ${tx.id}): ${formattedTransactions[0].details}. Please confirm the action (update or delete) and provide necessary details for update, including the ID.`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find transaction: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeConfirmedDeleteTransaction: tool({
      description: 'Deletes a specific transaction AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        transactionId: z.string().describe('The unique ID of the transaction to delete.'),
      }),
      execute: async ({ transactionId }) => {
        try {
          const result = await transactionService.deleteTransaction(transactionId, userId);
          const response = { success: true, message: result.message };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete transaction: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeUpdateTransactionById: tool({
      description:
        'Updates specific fields of a transaction AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        transactionId: z.string().describe('The unique ID of the transaction to update.'),
        newAmount: z
          .number()
          .positive('Amount must be positive.')
          .optional()
          .describe('The updated amount (optional).'),
        newDescription: z
          .string()
          .min(1)
          .optional()
          .describe('The updated description (optional).'),
        newType: z.enum(['income', 'expense']).optional().describe('The updated type (optional).'),
        newAccountName: z
          .string()
          .min(1)
          .optional()
          .describe('The updated account name (optional).'),
        newCategoryName: z.string().optional().describe('The updated category name (optional).'),
        newDate: z
          .string()
          .optional()
          .describe("The updated date (e.g., 'today', '2024-03-15') (optional)."),
        newTransferDetails: z.string().optional().describe('Updated transfer details (optional).'),
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
          if (newValues.newDate !== undefined) {
            const date = parseDateDescription(newValues.newDate);
            payload.createdAt = date;
          }
          if (newValues.newAccountName) {
            const newAccountId = await findAccountIdByName(userId, newValues.newAccountName);
            if (!newAccountId)
              throw new HTTPException(404, {
                message: `Update failed: Account "${newValues.newAccountName}" not found.`,
              });
            payload.account = newAccountId;
          }
          if (newValues.newCategoryName !== undefined) {
            const newCategoryId = await findCategoryIdByName(userId, newValues.newCategoryName);
            if (newValues.newCategoryName && !newCategoryId) {
              throw new HTTPException(404, {
                message: `Update failed: Category "${newValues.newCategoryName}" not found.`,
              });
            }
            payload.category = newCategoryId;
          }

          if (Object.keys(payload).length === 0) {
            throw new HTTPException(400, { message: 'No valid fields provided for update.' });
          }

          await transactionService.updateTransaction(transactionId, userId, payload);
          const response = {
            success: true,
            message: `Transaction (ID: ${transactionId}) updated.`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to update transaction: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    getExtremeTransaction: tool({
      description:
        'Finds the single highest or lowest transaction (income or expense) within a specified time period (e.g., "highest expense last month", "lowest income this year").',
      parameters: z.object({
        type: z
          .enum(['highest_income', 'lowest_income', 'highest_expense', 'lowest_expense'])
          .describe('The type of extreme transaction to find.'),
        period: z
          .string()
          .optional()
          .describe(
            "Time period like 'today', 'last week', 'this month', 'last year'. Defaults to 'this month' if not specified.",
          ),
        accountName: z.string().optional().describe('Optional: Filter by a specific account name.'),
      }),
      execute: async ({ type, period = 'this month', accountName }) => {
        try {
          const accountId = accountName
            ? await findAccountIdByName(userId, accountName)
            : undefined;
          if (!accountId)
            throw new HTTPException(404, { message: `Account "${accountName}" not found.` });

          const transaction = await transactionService.getExtremeTransaction(
            userId,
            type,
            period,
            accountId,
          );

          if (!transaction) {
            const response = {
              success: true,
              message: `No ${type.replace('_', ' ')} found for ${period}.`,
              data: null,
            };
            return createJsonResponse(response);
          }

          const formattedDate = safeFormatDate(transaction.createdAt, 'yyyy-MM-dd'); // Use safe formatter
          const response = {
            success: true,
            message: `Found the ${type.replace('_', ' ')} for ${period}: ${
              transaction.text
            } (${formatCurrency(transaction.amount, transaction.currency)}) on ${formattedDate}.`, // Use backend formatCurrency
            data: {
              id: transaction.id,
              text: transaction.text,
              amount: transaction.amount,
              type: transaction.isIncome ? 'income' : 'expense',
              date: formattedDate,
              category: transaction.category?.name,
              account: transaction.account?.name,
            },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find extreme transaction: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
  };
}

export function createBudgetTools(userId: string) {
  return {
    createBudget: tool({
      description: 'Creates a monthly budget for a specific expense category.',
      parameters: z.object({
        categoryName: z
          .string()
          .min(1)
          .describe(
            "The name of the category to set the budget for (e.g., 'Groceries', 'Eating Out').",
          ),
        amount: z.number().positive('The budget amount must be a positive number.'),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .describe('The month number (1=Jan, 12=Dec) for the budget.'),
        year: z
          .number()
          .int()
          .min(1900)
          .max(2100)
          .describe('The full year (e.g., 2024) for the budget.'),
      }),
      execute: async ({ categoryName, amount, month, year }) => {
        try {
          const categoryId = await findCategoryIdByName(userId, categoryName);
          if (!categoryId)
            throw new HTTPException(404, { message: `Category "${categoryName}" not found.` });
          const payload = { category: categoryId, amount, month, year };
          const newBudget = await budgetService.createBudget(userId, payload);
          const response = {
            success: true,
            message: `Budget of ${amount} set for ${categoryName} for ${month}/${year}.`,
            data: {
              id: newBudget.id,
              category: categoryName,
              amount: newBudget.amount,
              month: newBudget.month,
              year: newBudget.year,
            },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create budget: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    listBudgets: tool({
      description: 'Lists existing budgets, optionally filtering by month and year.',
      parameters: z.object({
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe('Filter by month number (1-12).'),
        year: z
          .number()
          .int()
          .min(1900)
          .max(2100)
          .optional()
          .describe('Filter by full year (e.g., 2024).'),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .default(20)
          .describe('Max number of budgets to return.'),
      }),
      execute: async ({ month, year, limit = 20 }) => {
        try {
          const { data: budgets } = await budgetService.getBudgets(userId, 1, 500, 'year', 'desc');
          let filteredBudgets = budgets;
          if (month !== undefined)
            filteredBudgets = filteredBudgets.filter((b) => b.month === month);
          if (year !== undefined) filteredBudgets = filteredBudgets.filter((b) => b.year === year);
          filteredBudgets = filteredBudgets.slice(0, limit);

          const message =
            filteredBudgets.length > 0
              ? `Found ${filteredBudgets.length} budget(s) matching criteria.`
              : 'No budgets found matching criteria.';
          const response = {
            success: true,
            message: message,
            data: filteredBudgets.map((b) => ({
              id: b.id,
              category: b.category?.name,
              amount: b.amount,
              month: b.month,
              year: b.year,
            })),
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list budgets: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    findBudgetForUpdateOrDelete: tool({
      description:
        'Identifies a specific budget based on category, month, and year for potential update or deletion.',
      parameters: z.object({
        categoryName: z.string().min(1).describe('The category name of the budget.'),
        month: z.number().int().min(1).max(12).describe('The month number (1-12).'),
        year: z.number().int().min(1900).max(2100).describe('The full year (e.g., 2024).'),
      }),
      execute: async ({ categoryName, month, year }) => {
        try {
          const categoryId = await findCategoryIdByName(userId, categoryName);
          if (!categoryId)
            throw new HTTPException(404, { message: `Category "${categoryName}" not found.` });
          const budget = await db.query.Budget.findFirst({
            where: and(
              eq(Budget.userId, userId),
              eq(Budget.category, categoryId),
              eq(Budget.month, month),
              eq(Budget.year, year),
            ),
            columns: { id: true, amount: true },
          });
          if (!budget)
            throw new HTTPException(404, {
              message: `Budget for ${categoryName} in ${month}/${year} not found.`,
            });
          const response = {
            success: true,
            confirmationNeeded: true,
            id: budget.id,
            details: `Budget for ${categoryName} (${month}/${year}), Amount: ${budget.amount}`,
            message: `Found budget (ID: ${budget.id}): ${categoryName} (${month}/${year}) amount ${budget.amount}. Confirm action (update/delete) and include the ID?`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find budget: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeUpdateBudgetById: tool({
      description:
        'Updates the amount of a specific budget AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('The unique ID of the budget to update.'),
        newAmount: z.number().positive('The new budget amount (must be positive).'),
      }),
      execute: async ({ budgetId, newAmount }) => {
        try {
          await budgetService.updateBudget(budgetId, userId, newAmount);
          const response = {
            success: true,
            message: `Budget (ID: ${budgetId}) updated to ${newAmount}.`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to update budget: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeConfirmedDeleteBudget: tool({
      description: 'Deletes a specific budget AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('The unique ID of the budget to delete.'),
      }),
      execute: async ({ budgetId }) => {
        try {
          const result = await budgetService.deleteBudget(budgetId, userId);
          const response = { success: true, message: result.message };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete budget: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    getBudgetSummary: tool({
      description:
        "Retrieves the budget summary, showing budgeted amounts versus actual spending for categories within a specified period (e.g., 'this month', 'last month', 'YYYY-MM').",
      parameters: z.object({
        period: z
          .string()
          .optional()
          .describe(
            "The period for the summary (e.g., 'this month', 'last month', '2024-08'). Defaults to 'this month'.",
          ),
      }),
      execute: async ({ period = 'this month' }) => {
        try {
          let queryParams: { month?: string; year?: string; duration?: string } = {
            duration: period,
          };
          const yearMonthMatch = period.match(/^(\d{4})-(\d{1,2})$/);
          if (yearMonthMatch) {
            queryParams = { year: yearMonthMatch[1], month: yearMonthMatch[2] };
          } else if (period === 'this month') {
            queryParams = {
              year: getYear(new Date()).toString(),
              month: (getMonth(new Date()) + 1).toString(),
            };
          } else if (period === 'last month') {
            const lastMonthDate = subMonths(new Date(), 1);
            queryParams = {
              year: getYear(lastMonthDate).toString(),
              month: (getMonth(lastMonthDate) + 1).toString(),
            };
          }

          const summaryData = await budgetService.getBudgetSummary(userId, queryParams);
          const message =
            summaryData.length > 0
              ? `Budget summary for ${period}:`
              : `No budget data found for ${period}.`;
          const response = { success: true, message: message, data: summaryData };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to get budget summary: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    getBudgetProgress: tool({
      description:
        'Retrieves the current spending progress against the budget for a specific category in the current month.',
      parameters: z.object({
        categoryName: z
          .string()
          .min(1)
          .describe('The name of the category to check budget progress for.'),
      }),
      execute: async ({ categoryName }) => {
        try {
          const progressData = await budgetService.getBudgetProgressByName(userId, categoryName);
          // Use backend formatCurrency
          const response = {
            success: true,
            message: `Budget progress for ${categoryName}: Spent ${formatCurrency(
              progressData.totalSpent,
              'INR',
            )} of ${formatCurrency(
              progressData.budgetedAmount,
              'INR',
            )} (${progressData.progress.toFixed(1)}%). Remaining: ${formatCurrency(
              progressData.remainingAmount,
              'INR',
            )}.`,
            data: progressData,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to get budget progress: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
  };
}

type GoalApiPayload = {
  name?: string;
  targetAmount?: number;
  savedAmount?: number;
  targetDate?: Date | null;
};

export function createGoalTools(userId: string) {
  return {
    createSavingGoal: tool({
      description: 'Creates a new saving goal for the user.',
      parameters: z.object({
        goalName: z
          .string()
          .min(1)
          .describe("The name of the saving goal (e.g., 'New Car Fund', 'Vacation to Goa')."),
        targetAmount: z.number().positive('The target amount to save (must be positive).'),
        targetDate: z
          .string()
          .optional()
          .describe("Optional target date (e.g., 'end of year', '2025-12-31')."),
      }),
      execute: async ({ goalName, targetAmount, targetDate }) => {
        try {
          let parsedDate: Date | undefined = undefined;
          if (targetDate) {
            const range = parseNaturalLanguageDateRange(targetDate);
            parsedDate = range?.endDate;
          }
          const payload = { name: goalName, targetAmount, targetDate: parsedDate };
          const newGoal = await goalService.createGoal(userId, payload);
          const response = {
            success: true,
            message: `Saving goal "${newGoal.name}" created.`,
            data: {
              id: newGoal.id,
              name: newGoal.name,
              target: newGoal.targetAmount,
              date: newGoal.targetDate,
            },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create saving goal: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    listSavingGoals: tool({
      description: 'Lists all current saving goals for the user.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const { data: goals } = await goalService.getGoals(userId, 1, 100, 'targetDate', 'asc');
          const message =
            goals.length > 0 ? `Found ${goals.length} saving goal(s).` : 'No saving goals found.';
          const response = {
            success: true,
            message: message,
            data: goals.map((g) => ({
              id: g.id,
              name: g.name,
              saved: g.savedAmount,
              target: g.targetAmount,
              date: g.targetDate,
            })),
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list goals: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    findSavingGoal: tool({
      description:
        'Identifies a specific saving goal by its name for potential modification or deletion.',
      parameters: z.object({
        goalName: z.string().min(1).describe('The name of the saving goal to find.'),
      }),
      execute: async ({ goalName }) => {
        try {
          const goalInfo = await findGoalIdByName(userId, goalName);
          if (!goalInfo)
            throw new HTTPException(404, {
              message: `Saving goal matching "${goalName}" not found.`,
            });
          const response = {
            success: true,
            confirmationNeeded: true,
            id: goalInfo.id,
            details: `Goal: ${goalInfo.name}`,
            message: `Found goal (ID: ${goalInfo.id}): ${goalInfo.name}. Confirm action (update, delete, add/withdraw amount) and include the ID?`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find goal: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeUpdateSavingGoalById: tool({
      description:
        'Updates the target amount or target date of a specific saving goal AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The unique ID of the saving goal to update.'),
        newTargetAmount: z
          .number()
          .positive('New target amount must be positive.')
          .optional()
          .describe('The new target amount (optional).'),
        newTargetDate: z
          .string()
          .optional()
          .describe("The new target date (e.g., '2025-12-31') (optional)."),
      }),
      execute: async ({ goalId, newTargetAmount, newTargetDate }) => {
        try {
          const payload: Partial<GoalApiPayload> = {};
          if (newTargetAmount !== undefined) payload.targetAmount = newTargetAmount;
          if (newTargetDate !== undefined) {
            const parsedDate = newTargetDate ? parseISO(newTargetDate) : null;
            if (newTargetDate && !isValidDateFn(parsedDate))
              throw new HTTPException(400, { message: 'Invalid date format. Use YYYY-MM-DD.' });
            payload.targetDate = parsedDate;
          }
          if (Object.keys(payload).length === 0)
            throw new HTTPException(400, { message: 'No valid fields provided for update.' });

          await goalService.updateGoal(goalId, userId, payload);
          const response = { success: true, message: `Saving goal (ID: ${goalId}) updated.` };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to update goal: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeAddAmountToGoalById: tool({
      description:
        'Adds an amount to a specific saving goal AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The unique ID of the saving goal.'),
        amountToAdd: z.number().positive('The amount to add (must be positive).'),
      }),
      execute: async ({ goalId, amountToAdd }) => {
        try {
          await goalService.addAmountToGoal(goalId, userId, amountToAdd);
          const response = {
            success: true,
            message: `Added ${amountToAdd} to goal (ID: ${goalId}).`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to add amount: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeWithdrawAmountFromGoalById: tool({
      description:
        'Withdraws an amount from a specific saving goal AFTER user confirmation, using its unique ID. Fails if withdrawal exceeds saved amount.',
      parameters: z.object({
        goalId: z.string().describe('The unique ID of the saving goal.'),
        amountToWithdraw: z.number().positive('The amount to withdraw (must be positive).'),
      }),
      execute: async ({ goalId, amountToWithdraw }) => {
        try {
          await goalService.withdrawAmountFromGoal(goalId, userId, amountToWithdraw);
          const response = {
            success: true,
            message: `Withdrew ${amountToWithdraw} from goal (ID: ${goalId}).`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to withdraw amount: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeConfirmedDeleteGoal: tool({
      description: 'Deletes a specific saving goal AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The unique ID of the saving goal to delete.'),
      }),
      execute: async ({ goalId }) => {
        try {
          const result = await goalService.deleteGoal(goalId, userId);
          const response = { success: true, message: result.message };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete goal: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
  };
}

export function createInvestmentAccountTools(userId: string) {
  return {
    createInvestmentAccount: tool({
      description: 'Creates a new account for tracking investments (e.g., brokerage account).',
      parameters: z.object({
        accountName: z
          .string()
          .min(1)
          .describe(
            "Name for the investment account (e.g., 'Zerodha Stocks', 'Groww Mutual Funds').",
          ),
        platform: z
          .string()
          .optional()
          .describe("Name of the platform or broker (e.g., 'Zerodha', 'Groww', 'Upstox')."),
        currency: z
          .string()
          .length(3)
          .describe('The 3-letter currency code for this account (e.g., INR, USD).'),
      }),
      execute: async ({ accountName, platform, currency }) => {
        try {
          const payload = { name: accountName, platform, currency: currency.toUpperCase() };
          const newAccount = await investmentAccountService.createInvestmentAccount(
            userId,
            payload,
          );
          const response = {
            success: true,
            message: `Investment account "${newAccount.name}" created.`,
            data: {
              id: newAccount.id,
              name: newAccount.name,
              platform: newAccount.platform,
              currency: newAccount.currency,
            },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create investment account: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    listInvestmentAccounts: tool({
      description: "Lists the user's investment accounts.",
      parameters: z.object({}),
      execute: async () => {
        try {
          const { data: accounts } = await investmentAccountService.getInvestmentAccounts(
            userId,
            1,
            100,
            'name',
            'asc',
          );
          const message =
            accounts.length > 0
              ? `Found ${accounts.length} investment account(s).`
              : 'No investment accounts found.';
          const response = {
            success: true,
            message: message,
            data: accounts.map((a) => ({
              id: a.id,
              name: a.name,
              platform: a.platform,
              currency: a.currency,
            })),
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list investment accounts: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
  };
}

export function createInvestmentTools(userId: string) {
  return {
    addInvestment: tool({
      description:
        'Records a new investment holding (like stocks or mutual funds) within a specific investment account.',
      parameters: z.object({
        investmentAccountName: z
          .string()
          .min(1)
          .describe('The name of the investment account holding this investment.'),
        symbol: z
          .string()
          .min(1)
          .describe(
            "The stock ticker or mutual fund symbol (e.g., 'RELIANCE.NS', 'INFY', 'ICICIPRULI.MF').",
          ),
        shares: z.number().positive('Number of shares or units purchased.'),
        purchasePrice: z.number().nonnegative('Price per share/unit at the time of purchase.'),
        purchaseDate: z.string().describe("Date of purchase (e.g., 'today', '2024-01-15')."),
      }),
      execute: async ({ investmentAccountName, symbol, shares, purchasePrice, purchaseDate }) => {
        try {
          const accountId = await findInvestmentAccountIdByName(userId, investmentAccountName);
          if (!accountId)
            throw new HTTPException(404, {
              message: `Investment account "${investmentAccountName}" not found.`,
            });
          const parsedDate = parseDateDescription(purchaseDate);
          const payload: Pick<
            InferInsertModel<typeof Investment>,
            'symbol' | 'shares' | 'purchasePrice' | 'purchaseDate' | 'account'
          > = {
            account: accountId,
            symbol: symbol.toUpperCase(),
            shares,
            purchasePrice,
            purchaseDate: parsedDate,
          };
          const result = await investmentService.createInvestment(userId, payload as any);
          const response = {
            success: true,
            message: `Added ${shares} units of ${symbol} to ${investmentAccountName}.`,
            data: { id: result.data.id, symbol: result.data.symbol, shares: result.data.shares },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to add investment: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    listInvestments: tool({
      description: 'Lists investments held within a specific investment account.',
      parameters: z.object({
        investmentAccountName: z
          .string()
          .min(1)
          .describe('The name of the investment account to list holdings for.'),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .default(20)
          .describe('Max number of investments to return.'),
      }),
      execute: async ({ investmentAccountName, limit = 20 }) => {
        try {
          const accountId = await findInvestmentAccountIdByName(userId, investmentAccountName);
          if (!accountId)
            throw new HTTPException(404, {
              message: `Investment account "${investmentAccountName}" not found.`,
            });
          const { data: investments } = await investmentService.getInvestmentsForAccount(
            accountId,
            userId,
            1,
            limit,
            'symbol',
            'asc',
          );
          const message =
            investments.length > 0
              ? `Found ${investments.length} investment(s) in ${investmentAccountName}.`
              : `No investments found in ${investmentAccountName}.`;
          const response = {
            success: true,
            message: message,
            data: investments.map((i) => ({
              id: i.id,
              symbol: i.symbol,
              shares: i.shares,
              purchasePrice: i.purchasePrice,
              investedAmount: i.investedAmount,
            })),
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list investments: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
  };
}

export function createDebtTools(userId: string) {
  return {
    addDebt: tool({
      description:
        'Records a new debt, either money borrowed by the user (taken) or lent by the user (given).',
      parameters: z.object({
        amount: z.number().positive('The principal amount of the debt.'),
        type: z
          .enum(['given', 'taken'])
          .describe("'given' if you lent money, 'taken' if you borrowed money."),
        involvedUserEmailOrName: z
          .string()
          .min(1)
          .describe('The email address or exact name of the other person involved.'),
        description: z
          .string()
          .optional()
          .describe(
            "A brief description of the debt (e.g., 'Loan for bike', 'Borrowed for rent').",
          ),
        interestType: z
          .enum(['simple', 'compound'])
          .optional()
          .default('simple')
          .describe("Type of interest ('simple' or 'compound'). Default is simple."),
        interestRate: z
          .number()
          .nonnegative()
          .optional()
          .default(0)
          .describe('Annual interest rate percentage (e.g., 12 for 12%). Default 0.'),
        accountName: z
          .string()
          .optional()
          .describe('The account used for this debt transaction, if applicable (optional).'),
        dueDate: z.string().optional().describe("Optional due date (e.g., '2025-12-31')."),
        durationType: z
          .enum(['year', 'month', 'week', 'day', 'custom'])
          .optional()
          .describe("Duration unit (year, month, week, day) or 'custom' if using date range."),
        frequency: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(
            "Number of duration units (e.g., 3 for 3 months). Required if durationType is not 'custom'.",
          ),
        customDateRange: z
          .string()
          .optional()
          .describe("Date range as 'YYYY-MM-DD,YYYY-MM-DD' if durationType is 'custom'."),
      }),
      execute: async (args) => {
        try {
          const {
            amount,
            type,
            involvedUserEmailOrName,
            description,
            interestType = 'simple',
            interestRate = 0,
            accountName,
            dueDate,
            durationType,
            frequency,
            customDateRange,
          } = args;

          const involvedUser = await db.query.User.findFirst({
            where: or(
              eq(User.email, involvedUserEmailOrName),
              eq(User.name, involvedUserEmailOrName),
            ),
            columns: { id: true },
          });
          if (!involvedUser)
            throw new HTTPException(404, {
              message: `User "${involvedUserEmailOrName}" not found.`,
            });
          if (involvedUser.id === userId)
            throw new HTTPException(400, { message: 'Cannot create debt with yourself.' });

          const accountId = accountName ? await findAccountIdByName(userId, accountName) : null;
          if (accountName && !accountId)
            throw new HTTPException(404, { message: `Account "${accountName}" not found.` });

          let apiDuration: string;
          let apiFrequency: string | undefined = undefined;

          if (durationType === 'custom' && customDateRange) {
            apiDuration = customDateRange;
          } else if (durationType && frequency) {
            apiDuration = durationType;
            apiFrequency = String(frequency);
          } else if (dueDate) {
            apiDuration = `${formatDateFn(new Date(), 'yyyy-MM-dd')},${formatDateFn(
              parseDateDescription(dueDate),
              'yyyy-MM-dd',
            )}`;
          } else {
            throw new HTTPException(400, {
              message: 'Either duration/frequency or a custom date range/due date is required.',
            });
          }

          const payload: any = {
            amount: amount,
            type: type,
            userId: involvedUser.id,
            description: description,
            interestType: interestType,
            percentage: interestRate,
            account: accountId,
            duration: apiDuration,
            frequency: apiFrequency,
            user: involvedUser.id,
          };

          const newDebt = await debtService.createDebt(userId, payload);
          const response = {
            success: true,
            message: `Debt (${type}) of ${amount} involving ${involvedUserEmailOrName} recorded.`,
            data: {
              id: newDebt.id,
              description: newDebt.description,
              amount: newDebt.amount,
              type: newDebt.type,
            },
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException ? error.message : `Failed to add debt: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    listDebts: tool({
      description:
        'Lists debts, either money owed to the user (given) or by the user (taken). Can filter by type and paid status.',
      parameters: z.object({
        type: z
          .enum(['given', 'taken'])
          .optional()
          .describe("Filter by debt type: 'given' (lent) or 'taken' (borrowed)."),
        showPaid: z
          .boolean()
          .optional()
          .default(false)
          .describe('Include already paid debts (default is false).'),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .default(20)
          .describe('Max number of debts to return.'),
      }),
      execute: async ({ type, showPaid = false, limit = 20 }) => {
        try {
          const filters = { type: type };
          const { data: debts } = await debtService.getDebts(
            userId,
            filters,
            1,
            limit,
            'dueDate',
            'asc',
          );
          let filteredDebts = debts;
          if (!showPaid) {
            filteredDebts = debts.filter((d) => !d.debts.isPaid);
          }

          const message =
            filteredDebts.length > 0
              ? `Found ${filteredDebts.length} debt(s) matching criteria.`
              : 'No debts found matching criteria.';
          const response = {
            success: true,
            message: message,
            data: filteredDebts.map((d) => ({
              id: d.debts.id,
              description: d.debts.description,
              amount: d.debts.amount,
              type: d.debts.type,
              isPaid: d.debts.isPaid,
              dueDate: d.debts.dueDate,
            })),
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list debts: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    markDebtAsPaid: tool({
      description:
        'Identifies a specific debt based on its description or involved user, then asks for confirmation to mark it as paid.',
      parameters: z.object({
        identifier: z
          .string()
          .min(3)
          .describe(
            "Information to identify the debt (e.g., 'loan from John', 'rent borrowed last month').",
          ),
      }),
      execute: async ({ identifier }) => {
        try {
          const debtInfo = await findDebtId(userId, identifier);
          if (!debtInfo)
            throw new HTTPException(404, {
              message: `Could not uniquely identify debt matching "${identifier}".`,
            });
          const response = {
            success: true,
            confirmationNeeded: true,
            id: debtInfo.id,
            details: debtInfo.details,
            message: `Found debt (ID: ${debtInfo.id}): ${debtInfo.details}. Confirm marking as paid by including the ID?`,
          };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find debt: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
    executeConfirmedMarkDebtPaid: tool({
      description: 'Marks a specific debt as paid AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        debtId: z.string().describe('The unique ID of the debt to mark as paid.'),
      }),
      execute: async ({ debtId }) => {
        try {
          const result = await debtService.markDebtAsPaid(debtId, userId);
          const response = { success: true, message: result.message };
          return createJsonResponse(response);
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to mark debt paid: ${error.message}`;
          const response = { success: false, error: message };
          return createJsonResponse(response);
        }
      },
    }),
  };
}
