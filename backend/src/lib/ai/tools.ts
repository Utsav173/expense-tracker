// src/lib/ai/tools.ts

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
} from '../../database/schema';
import { db } from '../../database';
import { goalService } from '../../services/goal.service';
import { budgetService } from '../../services/budget.service';
import { debtService } from '../../services/debt.service';
import { investmentAccountService } from '../../services/investmentAccount.service';
import { investmentService } from '../../services/investment.service';

// --- Helper Functions (Keep as before) ---

function parseDateDescription(dateDescription: string | undefined | null): Date {
  const now = new Date();
  if (!dateDescription) return now;
  const lowerDesc = dateDescription.toLowerCase();
  if (lowerDesc === 'today') return now;
  if (lowerDesc === 'yesterday') return subDays(now, 1);
  try {
    const parsedDate = parseDateFn(dateDescription, 'yyyy-MM-dd', new Date());
    if (isValidDateFn(parsedDate)) {
      parsedDate.setHours(12, 0, 0, 0);
      return parsedDate;
    }
  } catch (e) {
    /* ignore */
  }
  console.warn(`Could not parse date description: "${dateDescription}", defaulting to today.`);
  return now;
}

async function findAccountIdByName(userId: string, accountName: string): Promise<string | null> {
  if (!accountName || !accountName.trim()) return null;
  try {
    const accounts = await accountService.getAccountListSimple(userId);
    let foundAccount = accounts.find((acc) => acc.name === accountName.trim());
    if (!foundAccount) {
      foundAccount = accounts.find(
        (acc) => acc.name.toLowerCase() === accountName.trim().toLowerCase(),
      );
    }
    return foundAccount?.id ?? null;
  } catch (error) {
    console.error(`Error finding account ID for name "${accountName}":`, error);
    return null;
  }
}

async function findCategoryIdByName(userId: string, categoryName: string): Promise<string | null> {
  if (!categoryName || !categoryName.trim()) return null;
  try {
    const { categories } = await categoryService.getCategories(
      userId,
      1,
      500,
      categoryName.trim(),
      'name',
      'asc',
    );
    let foundCategory = categories.find((cat) => cat.name === categoryName.trim());
    if (!foundCategory) {
      foundCategory = categories.find(
        (cat) => cat.name.toLowerCase() === categoryName.trim().toLowerCase(),
      );
    }
    return foundCategory?.id ?? null;
  } catch (error) {
    console.error(`Error finding category ID for name "${categoryName}":`, error);
    return null;
  }
}

// Helper to find Investment Account ID
async function findInvestmentAccountIdByName(
  userId: string,
  invAccountName: string,
): Promise<string | null> {
  if (!invAccountName || !invAccountName.trim()) return null;
  try {
    // Assuming investmentAccountService has a suitable listing method
    const { data: accounts } = await investmentAccountService.getInvestmentAccounts(
      userId,
      1,
      100,
      'name',
      'asc',
    ); // Fetch potential matches
    const foundAccount = accounts.find(
      (acc) => acc.name.toLowerCase() === invAccountName.trim().toLowerCase(),
    );
    return foundAccount?.id ?? null;
  } catch (error) {
    console.error(`Error finding investment account ID for name "${invAccountName}":`, error);
    return null;
  }
}

// Helper to find Debt ID (more complex, might need better identifiers)
async function findDebtId(userId: string, identifier: string): Promise<string | null> {
  // Simple search based on description for now. Needs improvement.
  try {
    const { data: debts } = await debtService.getDebts(
      userId,
      { q: identifier },
      1,
      5,
      'createdAt',
      'desc',
    );
    if (debts.length === 1) {
      return debts[0].debts.id; // Assuming structure from service
    }
    // Handle multiple matches or no match (return null or throw clarification needed)
    console.warn(
      `Debt search for "${identifier}" yielded ${debts.length} results. Cannot uniquely identify.`,
    );
    return null;
  } catch (error) {
    console.error(`Error finding debt ID for identifier "${identifier}":`, error);
    return null;
  }
}

// Helper to find Saving Goal ID by name
async function findGoalIdByName(userId: string, goalName: string): Promise<string | null> {
  if (!goalName || !goalName.trim()) return null;
  try {
    // Assuming goalService has a suitable listing method or use direct query
    const { data: goals } = await goalService.getGoals(userId, 1, 100, 'name', 'asc'); // Fetch goals
    const foundGoal = goals.find((g) => g.name.toLowerCase() === goalName.trim().toLowerCase());
    return foundGoal?.id ?? null;
  } catch (error) {
    console.error(`Error finding goal ID for name "${goalName}":`, error);
    return null;
  }
}

// --- Tool Definition Creators ---

export function createAccountTools(userId: string) {
  return {
    createAccount: tool({
      /* ... (no change) ... */
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
          return {
            success: true,
            message: `Account "${result.data.name}" created successfully with ID ${result.data.id}.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create account: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    listAccounts: tool({
      /* ... (no change) ... */
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
          if (accounts.length === 0) {
            return {
              success: true,
              accounts: [],
              message: searchName
                ? `No accounts found matching "${searchName}".`
                : 'No accounts found.',
            };
          }
          const formattedList = accounts
            .map((acc) => `${acc.name} (${acc.balance?.toFixed(2)} ${acc.currency})`)
            .join('\n');
          return {
            success: true,
            accounts: accounts,
            message: `Found accounts:\n${formattedList}`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list accounts: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    getAccountBalance: tool({
      /* ... (no change) ... */
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
            return { success: false, error: `Account named "${accountName}" not found.` };
          const account = await accountService.getAccountById(accountId, userId);
          return {
            success: true,
            balance: account.balance,
            currency: account.currency,
            message: `Balance for ${account.name} is ${account.balance} ${account.currency}.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to get balance: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // Renamed original update tool, now requires ID
    executeUpdateAccountNameById: tool({
      description: 'Updates the name of an existing financial account using its specific ID.',
      parameters: z.object({
        accountId: z.string().describe('The unique ID of the account to rename.'),
        newAccountName: z.string().min(1).describe('The desired new name for the account.'),
      }),
      execute: async ({ accountId, newAccountName }) => {
        try {
          // Service method already checks ownership based on userId passed to it implicitly
          await accountService.updateAccount(
            accountId,
            userId,
            newAccountName,
            undefined,
            undefined,
          );
          // We don't know the old name here easily without another query, so generic success message
          return {
            success: true,
            message: `Account (ID: ${accountId}) renamed to "${newAccountName}".`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to rename account: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // Kept the identification tool
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
            return { success: false, error: `Account named "${accountName}" not found.` };
          return {
            success: true,
            confirmationNeeded: true,
            accountId: accountId,
            accountName: accountName,
            message: `ACTION REQUIRED: Please confirm deletion of account "${accountName}" (ID: ${accountId}). This will also delete all associated transactions and cannot be undone.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to identify account for deletion: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // New tool for confirmed deletion
    executeConfirmedDeleteAccount: tool({
      description:
        'Deletes a specific financial account and all its data AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        accountId: z.string().describe('The unique ID of the account to delete.'),
      }),
      execute: async ({ accountId }) => {
        try {
          // Service method performs ownership check implicitly via userId
          await accountService.deleteAccount(accountId, userId);
          return {
            success: true,
            message: `Account (ID: ${accountId}) and its data have been deleted.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete account: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
  };
}

export function createCategoryTools(userId: string) {
  return {
    createCategory: tool({
      /* ... (no change) ... */
      description: 'Creates a new custom category for classifying income or expenses.',
      parameters: z.object({
        categoryName: z.string().min(1).describe('The name for the new category.'),
      }),
      execute: async ({ categoryName }) => {
        try {
          const newCategory = await categoryService.createCategory(userId, categoryName);
          return {
            success: true,
            message: `Category "${newCategory.name}" created successfully with ID ${newCategory.id}.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create category: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    listCategories: tool({
      /* ... (no change) ... */
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
          if (categories.length === 0)
            return {
              success: true,
              categories: [],
              message: searchName
                ? `No categories found matching "${searchName}".`
                : 'No categories found.',
            };
          const formattedList = categories.map((cat) => cat.name).join(', ');
          return {
            success: true,
            categories: categories,
            message: `Found categories: ${formattedList}`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list categories: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // Renamed original update tool, now requires ID
    executeUpdateCategoryNameById: tool({
      description:
        'Updates the name of an existing custom category using its specific ID. Cannot rename shared/default categories.',
      parameters: z.object({
        categoryId: z.string().describe('The unique ID of the custom category to rename.'),
        newCategoryName: z.string().min(1).describe('The desired new name.'),
      }),
      execute: async ({ categoryId, newCategoryName }) => {
        try {
          // Service method handles ownership check and duplicate name check
          await categoryService.updateCategory(categoryId, userId, newCategoryName);
          return {
            success: true,
            message: `Category (ID: ${categoryId}) renamed to "${newCategoryName}".`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to rename category: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // Kept the identification tool
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
            where: and(eq(Category.name, categoryName), eq(Category.owner, userId)),
            columns: { id: true },
          });
          if (!category)
            return { success: false, error: `Custom category named "${categoryName}" not found.` };
          const categoryId = category.id;
          try {
            await categoryService.deleteCategory(categoryId, userId);
            return {
              success: true,
              confirmationNeeded: true,
              categoryId: categoryId,
              categoryName: categoryName,
              message: `ACTION REQUIRED: Please confirm deletion of category "${categoryName}" (ID: ${categoryId}). This cannot be undone.`,
            };
          } catch (serviceError: any) {
            const message =
              serviceError instanceof HTTPException ? serviceError.message : serviceError.message;
            return {
              success: false,
              error: `Cannot delete category "${categoryName}": ${message}`,
            };
          }
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to identify category for deletion: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // New tool for confirmed deletion
    executeConfirmedDeleteCategory: tool({
      description:
        'Deletes a specific custom category AFTER user confirmation, using its unique ID. Fails if transactions are associated.',
      parameters: z.object({
        categoryId: z.string().describe('The unique ID of the custom category to delete.'),
      }),
      execute: async ({ categoryId }) => {
        try {
          // Service method performs ownership and transaction checks
          await categoryService.deleteCategory(categoryId, userId);
          return { success: true, message: `Category (ID: ${categoryId}) has been deleted.` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete category: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
  };
}

export function createTransactionTools(userId: string) {
  return {
    addTransaction: tool({
      /* ... (no change) ... */
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
          if (!accountId) return { success: false, error: `Account "${accountName}" not found.` };

          let categoryId: string | null = null;
          if (categoryName) {
            categoryId = await findCategoryIdByName(userId, categoryName);
            if (!categoryId)
              return { success: false, error: `Category "${categoryName}" not found.` };
          }

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
          return {
            success: true,
            message: `Transaction added successfully to ${accountName}.`,
            data: result.data,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to add transaction: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    listTransactions: tool({
      description:
        'Lists transactions based on filters like account, category, date range, type, amount range, or text search.',
      // Enhanced parameters
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
          let accountId: string | undefined;
          if (accountName) {
            accountId = (await findAccountIdByName(userId, accountName)) ?? undefined;
            if (accountName && !accountId)
              return { success: false, error: `Account "${accountName}" not found.` };
          }

          let categoryId: string | undefined;
          if (categoryName) {
            categoryId = (await findCategoryIdByName(userId, categoryName)) ?? undefined;
            if (categoryName && !categoryId)
              return { success: false, error: `Category "${categoryName}" not found.` };
          }

          // Use the enhanced filter type
          const filters: Parameters<typeof transactionService.getTransactions>[0] = {
            // Get type from service
            accountId: accountId,
            userId: accountId ? undefined : userId,
            duration: dateRange,
            q: searchText,
            isIncome: type,
            categoryId: categoryId,
            minAmount: minAmount, // Pass amount filters
            maxAmount: maxAmount,
          };

          // Call service with filters
          const result = await transactionService.getTransactions(
            filters,
            1,
            limit,
            'createdAt',
            'desc',
          );

          if (result.transactions.length === 0) {
            return {
              success: true,
              transactions: [],
              message: 'No transactions found matching the criteria.',
            };
          }

          const summary = result.transactions
            .map(
              (t) =>
                `${formatDateFn(t.createdAt!, 'yyyy-MM-dd')}: ${t.text} (${t.isIncome ? '+' : '-'}${
                  t.amount
                } ${t.currency}) [${t.category?.name ?? 'Uncategorized'}]`,
            )
            .join('\n');
          const count = result.transactions.length;
          const total = result.pagination.total;

          return {
            success: true,
            transactions: result.transactions,
            message: `Found ${count} of ${total} transactions matching criteria:\n${summary}`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list transactions: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Kept identification tool
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
          let accountId: string | undefined;
          if (accountName) {
            accountId = (await findAccountIdByName(userId, accountName)) ?? undefined;
            if (accountName && !accountId)
              return { success: false, error: `Account "${accountName}" not found.` };
          }

          const filters: any = {
            accountId: accountId,
            userId: accountId ? undefined : userId,
            q: identifier,
            duration: dateHint
              ? formatDateFn(parseDateDescription(dateHint), 'yyyy-MM-dd,yyyy-MM-dd')
              : undefined,
            // Add amountHint filtering if service supports it
          };
          if (amountHint !== undefined) {
            filters.minAmount = amountHint * 0.9; // Example: +/- 10% range
            filters.maxAmount = amountHint * 1.1;
          }

          const result = await transactionService.getTransactions(
            filters,
            1,
            5,
            'createdAt',
            'desc',
          );

          if (result.transactions.length === 0) {
            return {
              success: false,
              error: `No transactions found matching "${identifier}"${
                accountName ? ` in account "${accountName}"` : ''
              }. Try being more specific.`,
            };
          }

          const formattedTransactions = result.transactions.map((t, index) => ({
            index: index + 1,
            id: t.id,
            details: `${formatDateFn(t.createdAt!, 'yyyy-MM-dd')}: ${t.text} (${
              t.isIncome ? '+' : '-'
            }${t.amount} ${t.currency})`,
          }));

          if (result.transactions.length > 1) {
            const optionsText = formattedTransactions
              .map((t) => `${t.index}. ${t.details} (ID: ${t.id})`)
              .join('\n');
            return {
              success: true,
              clarificationNeeded: true,
              possibleMatches: formattedTransactions,
              message: `Found multiple transactions matching "${identifier}". Please specify which one to modify/delete by its ID or number:\n${optionsText}`,
            };
          }

          const tx = result.transactions[0];
          return {
            success: true,
            confirmationNeeded: true,
            transactionId: tx.id,
            transactionDetails: formattedTransactions[0].details,
            message: `Found transaction (ID: ${tx.id}): ${formattedTransactions[0].details}. Please confirm the action (update or delete) and provide necessary details for update.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find transaction: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // New tool for confirmed deletion
    executeConfirmedDeleteTransaction: tool({
      description: 'Deletes a specific transaction AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        transactionId: z.string().describe('The unique ID of the transaction to delete.'),
      }),
      execute: async ({ transactionId }) => {
        try {
          // Service method performs ownership check
          await transactionService.deleteTransaction(transactionId, userId);
          return { success: true, message: `Transaction (ID: ${transactionId}) has been deleted.` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete transaction: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // New tool for confirmed update
    executeUpdateTransactionById: tool({
      description:
        'Updates specific fields of a transaction AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        transactionId: z.string().describe('The unique ID of the transaction to update.'),
        // Make all updateable fields optional
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
          // Prepare payload for the service
          const payload: Partial<InferInsertModel<typeof Transaction>> = {};
          let requiresAccountIdLookup = false;
          let requiresCategoryIdLookup = false;

          if (newValues.newAmount !== undefined) payload.amount = newValues.newAmount;
          if (newValues.newDescription !== undefined) payload.text = newValues.newDescription;
          if (newValues.newType !== undefined) payload.isIncome = newValues.newType === 'income';
          if (newValues.newTransferDetails !== undefined)
            payload.transfer = newValues.newTransferDetails;
          if (newValues.newDate !== undefined)
            payload.createdAt = parseDateDescription(newValues.newDate);

          if (newValues.newAccountName) {
            const newAccountId = await findAccountIdByName(userId, newValues.newAccountName);
            if (!newAccountId)
              return {
                success: false,
                error: `Update failed: Account "${newValues.newAccountName}" not found.`,
              };
            payload.account = newAccountId;
          }
          if (newValues.newCategoryName) {
            const newCategoryId = await findCategoryIdByName(userId, newValues.newCategoryName);
            if (!newCategoryId)
              return {
                success: false,
                error: `Update failed: Category "${newValues.newCategoryName}" not found.`,
              };
            payload.category = newCategoryId;
          } else if (
            newValues.hasOwnProperty('newCategoryName') &&
            newValues.newCategoryName === null
          ) {
            // Allow explicitly setting category to null
            payload.category = null;
          }

          if (Object.keys(payload).length === 0) {
            return { success: false, error: 'No valid fields provided for update.' };
          }

          // Service method handles ownership check
          await transactionService.updateTransaction(transactionId, userId, payload);
          return {
            success: true,
            message: `Transaction (ID: ${transactionId}) updated successfully.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to update transaction: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
  };
}

/**
 * Creates tool definitions related to Budget management, bound to a specific user.
 */
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
            return { success: false, error: `Category "${categoryName}" not found.` };

          const payload = { category: categoryId, amount, month, year };
          const newBudget = await budgetService.createBudget(userId, payload);
          return {
            success: true,
            message: `Budget of ${amount} set for category "${categoryName}" for ${month}/${year}.`,
            data: newBudget,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create budget: ${error.message}`;
          return { success: false, error: message };
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
          // Service needs update to handle month/year filtering directly
          // For now, fetch all and filter, or adjust service call if updated
          const { data: budgets } = await budgetService.getBudgets(
            userId,
            1,
            limit,
            'year',
            'desc',
          ); // Fetch recent first

          let filteredBudgets = budgets;
          if (month !== undefined)
            filteredBudgets = filteredBudgets.filter((b) => b.month === month);
          if (year !== undefined) filteredBudgets = filteredBudgets.filter((b) => b.year === year);

          if (filteredBudgets.length === 0) {
            return {
              success: true,
              budgets: [],
              message: 'No budgets found matching the criteria.',
            };
          }

          const formattedList = filteredBudgets
            .map(
              (b) =>
                `${b.category?.name ?? 'Unknown Category'} (${b.month}/${b.year}): ${b.amount}`,
            )
            .join('\n');
          return {
            success: true,
            budgets: filteredBudgets,
            message: `Found budgets:\n${formattedList}`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list budgets: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Tool to identify budget for update/delete
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
            return { success: false, error: `Category "${categoryName}" not found.` };

          const budget = await db.query.Budget.findFirst({
            where: and(
              eq(Budget.userId, userId),
              eq(Budget.category, categoryId),
              eq(Budget.month, month),
              eq(Budget.year, year),
            ),
            columns: { id: true, amount: true },
          });

          if (!budget) {
            return {
              success: false,
              error: `Budget for category "${categoryName}" in ${month}/${year} not found.`,
            };
          }

          return {
            success: true,
            confirmationNeeded: true, // Always need confirmation for update/delete
            budgetId: budget.id,
            budgetName: `${categoryName} (${month}/${year})`,
            currentAmount: budget.amount,
            message: `Found budget for ${categoryName} (${month}/${year}) with amount ${budget.amount}. Please confirm the action (update amount or delete) and provide necessary details.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find budget: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Tool for confirmed budget update
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
          return {
            success: true,
            message: `Budget (ID: ${budgetId}) amount updated to ${newAmount}.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to update budget: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Tool for confirmed budget deletion
    executeConfirmedDeleteBudget: tool({
      description: 'Deletes a specific budget AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('The unique ID of the budget to delete.'),
      }),
      execute: async ({ budgetId }) => {
        try {
          await budgetService.deleteBudget(budgetId, userId);
          return { success: true, message: `Budget (ID: ${budgetId}) has been deleted.` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete budget: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // Tool to get budget summary/progress
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
          // Parse period to month/year if possible, or use duration for service
          let queryParams: { month?: string; year?: string; duration?: string } = {
            duration: period,
          };
          const yearMonthMatch = period.match(/^(\d{4})-(\d{1,2})$/); // Match YYYY-MM
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
          // Add more period parsing if needed

          const summaryData = await budgetService.getBudgetSummary(userId, queryParams);
          if (summaryData.length === 0) {
            return {
              success: true,
              summary: [],
              message: `No budget data found for the period: ${period}.`,
            };
          }
          const formattedSummary = summaryData
            .map(
              (s) =>
                `${s.categoryName}: Spent ${s.actualSpend.toFixed(
                  2,
                )} / Budgeted ${s.budgetedAmount.toFixed(2)}`,
            )
            .join('\n');
          return {
            success: true,
            summary: summaryData,
            message: `Budget Summary for ${period}:\n${formattedSummary}`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to get budget summary: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
  };
}

/**
 * Creates tool definitions related to Saving Goal management, bound to a specific user.
 */
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
            // Attempt to parse natural language/date string - enhance parseNaturalLanguageDateRange if needed
            const range = parseNaturalLanguageDateRange(targetDate);
            parsedDate = range?.endDate; // Use end date of range as target
            if (!parsedDate) console.warn(`Could not parse target date "${targetDate}" for goal.`);
          }
          const payload = { name: goalName, targetAmount, targetDate: parsedDate };
          const newGoal = await goalService.createGoal(userId, payload);
          return {
            success: true,
            message: `Saving goal "${newGoal.name}" created with target ${newGoal.targetAmount}.`,
            data: newGoal,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create saving goal: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    listSavingGoals: tool({
      description: 'Lists all current saving goals for the user.',
      parameters: z.object({
        // Add filters later if needed (e.g., searchName)
      }),
      execute: async () => {
        try {
          const { data: goals } = await goalService.getGoals(userId, 1, 100, 'targetDate', 'asc'); // Fetch up to 100 goals, sorted by target date
          if (goals.length === 0) {
            return {
              success: true,
              goals: [],
              message: 'You currently have no saving goals set up.',
            };
          }
          const formattedList = goals
            .map(
              (g) =>
                `${g.name}: ${g.savedAmount?.toFixed(2)} / ${g.targetAmount.toFixed(2)} (Target: ${
                  g.targetDate ? formatDateFn(g.targetDate, 'yyyy-MM-dd') : 'N/A'
                })`,
            )
            .join('\n');
          return { success: true, goals: goals, message: `Your saving goals:\n${formattedList}` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list saving goals: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Tool to identify a goal for update/delete/add/withdraw
    findSavingGoal: tool({
      description:
        'Identifies a specific saving goal by its name for potential modification or deletion.',
      parameters: z.object({
        goalName: z.string().min(1).describe('The name of the saving goal to find.'),
      }),
      execute: async ({ goalName }) => {
        try {
          // Find goal by name (case-insensitive search might be better)
          const goals = await db.query.SavingGoal.findMany({
            where: and(eq(SavingGoal.userId, userId), ilike(SavingGoal.name, `%${goalName}%`)),
            limit: 5, // Limit potential matches
          });

          if (goals.length === 0) {
            return { success: false, error: `Saving goal matching "${goalName}" not found.` };
          }
          if (goals.length > 1) {
            const options = goals.map((g, i) => `${i + 1}. ${g.name} (ID: ${g.id})`).join('\n');
            return {
              success: true,
              clarificationNeeded: true,
              possibleMatches: goals.map((g) => ({ id: g.id, name: g.name })),
              message: `Found multiple goals matching "${goalName}". Please specify which one by ID or number:\n${options}`,
            };
          }

          // Exactly one match
          const goal = goals[0];
          return {
            success: true,
            confirmationNeeded: true, // Assume confirmation needed for any action
            goalId: goal.id,
            goalName: goal.name,
            goalDetails: `${goal.name}: ${goal.savedAmount?.toFixed(
              2,
            )} / ${goal.targetAmount.toFixed(2)} (Target: ${
              goal.targetDate ? formatDateFn(goal.targetDate, 'yyyy-MM-dd') : 'N/A'
            })`,
            message: `Found goal (ID: ${goal.id}): ${goal.name}. Please confirm the action (update, delete, add amount, withdraw amount) and provide necessary details.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find saving goal: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Tool for confirmed goal update
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
        // Note: Updating savedAmount is handled by add/withdraw tools
      }),
      execute: async ({ goalId, newTargetAmount, newTargetDate }) => {
        try {
          const payload: Partial<InferInsertModel<typeof SavingGoal>> = {};
          if (newTargetAmount !== undefined) payload.targetAmount = newTargetAmount;
          if (newTargetDate !== undefined) {
            const parsedDate = newTargetDate
              ? parseDateFn(newTargetDate, 'yyyy-MM-dd', new Date())
              : null;
            if (newTargetDate && !isValidDateFn(parsedDate))
              throw new HTTPException(400, { message: 'Invalid new target date format.' });
            payload.targetDate = parsedDate;
          }

          if (Object.keys(payload).length === 0)
            return { success: false, error: 'No valid fields provided for update.' };

          await goalService.updateGoal(goalId, userId, payload);
          return { success: true, message: `Saving goal (ID: ${goalId}) updated.` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to update saving goal: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Tool for confirmed add amount
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
          return { success: true, message: `Added ${amountToAdd} to saving goal (ID: ${goalId}).` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to add amount to goal: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Tool for confirmed withdraw amount
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
          return {
            success: true,
            message: `Withdrew ${amountToWithdraw} from saving goal (ID: ${goalId}).`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to withdraw amount from goal: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),

    // Tool for confirmed goal deletion
    executeConfirmedDeleteGoal: tool({
      description: 'Deletes a specific saving goal AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The unique ID of the saving goal to delete.'),
      }),
      execute: async ({ goalId }) => {
        try {
          await goalService.deleteGoal(goalId, userId);
          return { success: true, message: `Saving goal (ID: ${goalId}) has been deleted.` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to delete saving goal: ${error.message}`;
          return { success: false, error: message };
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
          return {
            success: true,
            message: `Investment account "${newAccount.name}" created.`,
            data: newAccount,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to create investment account: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    listInvestmentAccounts: tool({
      description: "Lists the user's investment accounts.",
      parameters: z.object({
        // Add search/filter later if needed
      }),
      execute: async () => {
        try {
          const { data: accounts } = await investmentAccountService.getInvestmentAccounts(
            userId,
            1,
            100,
            'name',
            'asc',
          );
          if (accounts.length === 0)
            return { success: true, accounts: [], message: 'No investment accounts found.' };
          const formattedList = accounts
            .map((acc) => `${acc.name} (${acc.platform || 'N/A'}, ${acc.currency})`)
            .join('\n');
          return {
            success: true,
            accounts: accounts,
            message: `Found investment accounts:\n${formattedList}`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list investment accounts: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // Add Identify/Update/Delete tools similar to Account/Category if needed
  };
}

// --- Investment Tools ---
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
            return {
              success: false,
              error: `Investment account "${investmentAccountName}" not found.`,
            };

          const parsedDate = parseDateDescription(purchaseDate); // Use date helper

          const payload: Pick<
            InferInsertModel<typeof Investment>,
            'symbol' | 'shares' | 'purchasePrice' | 'purchaseDate' | 'account'
          > = {
            account: accountId,
            symbol: symbol.toUpperCase(), // Standardize symbol
            shares,
            purchasePrice,
            purchaseDate: parsedDate,
          };
          const result = await investmentService.createInvestment(userId, payload); // Service calculates investedAmount
          return {
            success: true,
            message: `Added ${shares} units of ${symbol} to ${investmentAccountName}.`,
            data: result.data,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to add investment: ${error.message}`;
          return { success: false, error: message };
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
            return {
              success: false,
              error: `Investment account "${investmentAccountName}" not found.`,
            };

          const { data: investments } = await investmentService.getInvestmentsForAccount(
            accountId,
            userId,
            1,
            limit,
            'symbol',
            'asc',
          );

          if (investments.length === 0)
            return {
              success: true,
              investments: [],
              message: `No investments found in account "${investmentAccountName}".`,
            };

          const formattedList = investments
            .map(
              (inv) =>
                `${inv.symbol}: ${inv.shares} units @ ${
                  inv.purchasePrice
                } (Invested: ${inv.investedAmount?.toFixed(2)}, Dividend: ${inv.dividend?.toFixed(
                  2,
                )})`,
            )
            .join('\n');
          return {
            success: true,
            investments: investments,
            message: `Investments in ${investmentAccountName}:\n${formattedList}`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list investments: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // Add Identify/Update/Delete tools similar to Transactions if needed
    // Identification might be by symbol within a specific account name
  };
}

// --- Debt Tools ---
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
      }),
      execute: async ({
        amount,
        type,
        involvedUserEmailOrName,
        description,
        interestType = 'simple',
        interestRate = 0,
        accountName,
        dueDate,
      }) => {
        try {
          // Find the involved user
          const involvedUser = await db.query.User.findFirst({
            where: or(
              eq(User.email, involvedUserEmailOrName),
              eq(User.name, involvedUserEmailOrName),
            ),
            columns: { id: true },
          });
          if (!involvedUser)
            return { success: false, error: `User "${involvedUserEmailOrName}" not found.` };
          if (involvedUser.id === userId)
            return { success: false, error: 'Cannot create a debt with yourself.' };

          let accountId: string | undefined | null = null;
          if (accountName) {
            accountId = await findAccountIdByName(userId, accountName);
            if (!accountId) return { success: false, error: `Account "${accountName}" not found.` };
          }

          const payload: Omit<
            InferInsertModel<typeof Debts>,
            | 'id'
            | 'createdAt'
            | 'updatedAt'
            | 'createdBy'
            | 'premiumAmount'
            | 'duration'
            | 'frequency'
          > & { user: string } = {
            amount: amount,
            type: type,
            userId: involvedUser.id, // This is the 'involvedUserId' from the service perspective
            description: description,
            interestType: interestType,
            percentage: interestRate,
            account: accountId,
            dueDate: dueDate
              ? parseDateDescription(dueDate).toISOString().split('T')[0]
              : undefined, // Use helper, format YYYY-MM-DD
            // premiumAmount, duration, frequency are not directly asked here, default in service
            user: involvedUser.id, // Duplicate? Service expects 'userId' for involved party
          };

          const newDebt = await debtService.createDebt(userId, payload as any); // Cast needed due to extra 'user' field? review service signature
          return {
            success: true,
            message: `Debt (${type}) of ${amount} involving ${involvedUserEmailOrName} recorded.`,
            data: newDebt,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException ? error.message : `Failed to add debt: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    listDebts: tool({
      description:
        'Lists debts, either money owed to the user (given) or by the user (taken). Can filter by type.',
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
          // Service needs enhancement to filter by isPaid status
          const filters = { type: type };
          const { data: debts } = await debtService.getDebts(
            userId,
            filters,
            1,
            limit,
            'dueDate',
            'asc',
          ); // Sort by due date

          let filteredDebts = debts;
          if (!showPaid) {
            filteredDebts = debts.filter((d) => !d.debts.isPaid);
          }

          if (filteredDebts.length === 0)
            return { success: true, debts: [], message: 'No debts found matching the criteria.' };

          const formattedList = filteredDebts
            .map(
              (d) =>
                `${d.debts.type === 'given' ? 'Lent to' : 'Borrowed from'} ${
                  d.debts.account || 'Unknown'
                }: ${d.debts.amount} (${d.debts.description || 'No description'}) - Due: ${
                  d.debts.dueDate || 'N/A'
                } ${d.debts.isPaid ? '[PAID]' : ''}`,
            )
            .join('\n');
          return { success: true, debts: filteredDebts, message: `Debts:\n${formattedList}` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to list debts: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    markDebtAsPaid: tool({
      description:
        'Marks a specific debt as paid based on its description or involved user. Requires identification first.',
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
          // Use findDebtId helper (or similar logic)
          const debtId = await findDebtId(userId, identifier);
          if (!debtId)
            return {
              success: false,
              error: `Could not uniquely identify debt matching "${identifier}". Please be more specific.`,
            };

          // Fetch details for confirmation message
          const debtDetails = await db.query.Debts.findFirst({
            where: eq(Debts.id, debtId),
            with: { involvedUser: { columns: { name: true } } },
          });

          return {
            success: true,
            confirmationNeeded: true,
            debtId: debtId,
            debtDetails: `${debtDetails?.type} ${debtDetails?.amount} involving ${debtDetails?.involvedUser?.name} (${debtDetails?.description})`,
            message: `ACTION REQUIRED: Found debt (ID: ${debtId}): ${debtDetails?.type} ${debtDetails?.amount} involving ${debtDetails?.involvedUser?.name} (${debtDetails?.description}). Please confirm marking this as paid.`,
          };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to find debt to mark as paid: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // New tool for confirmed marking as paid
    executeConfirmedMarkDebtPaid: tool({
      description: 'Marks a specific debt as paid AFTER user confirmation, using its unique ID.',
      parameters: z.object({
        debtId: z.string().describe('The unique ID of the debt to mark as paid.'),
      }),
      execute: async ({ debtId }) => {
        try {
          // Service method handles ownership/involved party check
          await debtService.markDebtAsPaid(debtId, userId);
          return { success: true, message: `Debt (ID: ${debtId}) marked as paid.` };
        } catch (error: any) {
          const message =
            error instanceof HTTPException
              ? error.message
              : `Failed to mark debt as paid: ${error.message}`;
          return { success: false, error: message };
        }
      },
    }),
    // Add Identify/Update/Delete tools similar to others if needed
  };
}
