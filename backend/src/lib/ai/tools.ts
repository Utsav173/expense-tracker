import { tool } from 'ai';
import { z } from 'zod';
import { accountService } from '../../services/account.service';
import { categoryService } from '../../services/category.service';
import { transactionService } from '../../services/transaction.service';
import { budgetService } from '../../services/budget.service';
import { goalService } from '../../services/goal.service';
import { debtService } from '../../services/debt.service';
import { investmentAccountService } from '../../services/investmentAccount.service';
import { investmentService } from '../../services/investment.service';
import { parseNaturalLanguageDateRange } from '../../utils/nl_date.utils';
import { HTTPException } from 'hono/http-exception';
import {
  startOfDay,
  isValid as isValidDateFn,
  getYear,
  getMonth,
  parseISO,
  format,
  isEqual,
  isBefore,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { InferInsertModel, and, eq, ilike, ne, or, sql } from 'drizzle-orm';
import {
  Transaction,
  Category,
  Budget,
  SavingGoal,
  Investment,
  User,
  Debts,
  InvestmentAccount,
  Account,
} from '../../database/schema';
import { db } from '../../database';
import { formatCurrency } from '../../utils/currency.utils';
import { financeService } from '../../services/finance.service';

interface ToolResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  confirmationNeeded?: boolean;
  id?: string;
  details?: string;
  clarificationNeeded?: boolean;
  options?: { id: string; name?: string; description?: string; details?: string }[];
}

const createToolResponse = (response: ToolResponse): string => {
  try {
    return JSON.stringify(response);
  } catch (e) {
    console.error('Error stringifying tool response:', e);
    return JSON.stringify({ success: false, error: 'Internal error formatting tool result.' });
  }
};

type ResolverResponse =
  | { id: string }
  | { clarificationNeeded: true; options: { id: string; name?: string; description?: string }[] }
  | { error: string };

async function resolveAccountId(userId: string, identifier: string): Promise<ResolverResponse> {
  if (!identifier || !identifier.trim()) return { error: 'Account identifier is required.' };
  try {
    const accounts = await db.query.Account.findMany({
      where: and(eq(Account.owner, userId), ilike(Account.name, `%${identifier.trim()}%`)),
      columns: { id: true, name: true },
      limit: 5,
    });

    if (accounts.length === 0) return { error: `Account like "${identifier}" not found.` };
    if (accounts.length === 1) return { id: accounts[0].id };

    const exactMatch = accounts.find(
      (acc) => acc.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatch) return { id: exactMatch.id };

    return {
      clarificationNeeded: true,
      options: accounts.map((a) => ({ id: a.id, name: a.name })),
    };
  } catch (error: any) {
    console.error(`Error resolving account ID for "${identifier}":`, error);
    return { error: `Failed to resolve account: ${error.message}` };
  }
}

async function resolveCategoryId(userId: string, identifier: string): Promise<ResolverResponse> {
  if (!identifier || !identifier.trim()) return { error: 'Category identifier is required.' };
  try {
    const categories = await db.query.Category.findMany({
      where: and(eq(Category.owner, userId), ilike(Category.name, `%${identifier.trim()}%`)),
      columns: { id: true, name: true },
      limit: 5,
    });

    if (categories.length === 0) return { error: `Category like "${identifier}" not found.` };
    if (categories.length === 1) return { id: categories[0].id };

    const exactMatch = categories.find(
      (cat) => cat.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatch) return { id: exactMatch.id };

    return {
      clarificationNeeded: true,
      options: categories.map((c) => ({ id: c.id, name: c.name })),
    };
  } catch (error: any) {
    console.error(`Error resolving category ID for "${identifier}":`, error);
    return { error: `Failed to resolve category: ${error.message}` };
  }
}

async function resolveInvestmentAccountId(
  userId: string,
  identifier: string,
): Promise<ResolverResponse> {
  if (!identifier || !identifier.trim())
    return { error: 'Investment account identifier is required.' };
  try {
    const accounts = await db.query.InvestmentAccount.findMany({
      where: and(
        eq(InvestmentAccount.userId, userId),
        ilike(InvestmentAccount.name, `%${identifier.trim()}%`),
      ),
      columns: { id: true, name: true },
      limit: 5,
    });

    if (accounts.length === 0)
      return { error: `Investment account like "${identifier}" not found.` };
    if (accounts.length === 1) return { id: accounts[0].id };

    const exactMatch = accounts.find(
      (acc) => acc.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatch) return { id: exactMatch.id };

    return {
      clarificationNeeded: true,
      options: accounts.map((a) => ({ id: a.id, name: a.name })),
    };
  } catch (error: any) {
    console.error(`Error resolving investment account ID for "${identifier}":`, error);
    return { error: `Failed to resolve investment account: ${error.message}` };
  }
}

async function resolveSavingGoalId(userId: string, identifier: string): Promise<ResolverResponse> {
  if (!identifier || !identifier.trim()) return { error: 'Goal identifier is required.' };
  try {
    const goals = await db.query.SavingGoal.findMany({
      where: and(eq(SavingGoal.userId, userId), ilike(SavingGoal.name, `%${identifier.trim()}%`)),
      columns: { id: true, name: true },
      limit: 5,
    });

    if (goals.length === 0) return { error: `Saving goal like "${identifier}" not found.` };
    if (goals.length === 1) return { id: goals[0].id };

    const exactMatch = goals.find(
      (goal) => goal.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatch) return { id: exactMatch.id };

    return {
      clarificationNeeded: true,
      options: goals.map((g) => ({ id: g.id, name: g.name })),
    };
  } catch (error: any) {
    console.error(`Error resolving goal ID for "${identifier}":`, error);
    return { error: `Failed to resolve goal: ${error.message}` };
  }
}

async function resolveDebtId(userId: string, identifier: string): Promise<ResolverResponse> {
  if (!identifier || !identifier.trim()) return { error: 'Debt identifier is required.' };
  try {
    const result = await debtService.getDebts(
      userId,
      { q: identifier.trim() },
      1,
      5,
      'createdAt',
      'desc',
    );
    const debts = result.data;

    if (debts.length === 0) return { error: `Debt like "${identifier}" not found.` };
    if (debts.length === 1) return { id: debts[0].debts.id };

    return {
      clarificationNeeded: true,
      options: debts.map((d) => ({
        id: d.debts.id,
        description: `${d.debts.type} - ${d.debts.description || 'No description'} (w/ ${
          d.user?.name ?? 'Unknown'
        })`,
      })),
    };
  } catch (error: any) {
    console.error(`Error resolving debt ID for "${identifier}":`, error);
    return { error: `Failed to resolve debt: ${error.message}` };
  }
}

async function resolveUserId(currentUserId: string, identifier: string): Promise<ResolverResponse> {
  if (!identifier || !identifier.trim()) return { error: 'User identifier is required.' };
  try {
    const users = await db.query.User.findMany({
      where: and(
        or(ilike(User.name, `%${identifier.trim()}%`), ilike(User.email, `%${identifier.trim()}%`)),
        eq(User.isActive, true),
        ne(User.id, currentUserId),
      ),
      columns: { id: true, name: true, email: true },
      limit: 5,
    });

    if (users.length === 0) return { error: `User like "${identifier}" not found or is inactive.` };
    if (users.length === 1) return { id: users[0].id };

    const exactMatchName = users.find(
      (u) => u.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatchName) return { id: exactMatchName.id };
    const exactMatchEmail = users.find(
      (u) => u.email.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatchEmail) return { id: exactMatchEmail.id };

    return {
      clarificationNeeded: true,
      options: users.map((u) => ({ id: u.id, name: `${u.name} (${u.email})` })),
    };
  } catch (error: any) {
    console.error(`Error resolving user ID for "${identifier}":`, error);
    return { error: `Failed to resolve user: ${error.message}` };
  }
}

type DateResolverResponse = { startDate?: Date; endDate?: Date; error?: string; singleDate?: Date };

async function resolveDateRangeForQuery(
  dateDescription?: string | null,
  defaultToThisMonth: boolean = false,
): Promise<DateResolverResponse> {
  const now = new Date();
  if (!dateDescription || dateDescription.trim() === '') {
    if (defaultToThisMonth) {
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
    return {};
  }

  try {
    const range = parseNaturalLanguageDateRange(dateDescription);
    if (range?.startDate && range?.endDate && isValidDateFn(range.startDate)) {
      const endDateAdjusted = endOfDay(range.endDate);
      return { startDate: range.startDate, endDate: endDateAdjusted };
    } else {
      return { error: `Could not understand the date/period: "${dateDescription}"` };
    }
  } catch (error: any) {
    console.error(`Error parsing date description "${dateDescription}":`, error);
    return { error: `Error parsing date: ${error.message}` };
  }
}

async function resolveSingleDate(
  dateDescription?: string | null,
  defaultToToday: boolean = true,
): Promise<DateResolverResponse> {
  const now = new Date();
  const defaultDate = defaultToToday ? startOfDay(now) : undefined;

  if (!dateDescription || dateDescription.trim() === '') {
    return defaultDate ? { singleDate: defaultDate } : {};
  }

  try {
    const range = parseNaturalLanguageDateRange(dateDescription);
    if (
      range?.startDate &&
      range?.endDate &&
      isValidDateFn(range.startDate) &&
      isEqual(startOfDay(range.startDate), startOfDay(range.endDate))
    ) {
      return { singleDate: range.startDate };
    } else if (range?.startDate && isValidDateFn(range.startDate)) {
      return {
        error: `Expected a single date but received a range for "${dateDescription}". Please be more specific (e.g., 'today', 'yesterday', 'YYYY-MM-DD').`,
      };
    } else {
      const parsedSpecific = parseISO(dateDescription);
      if (isValidDateFn(parsedSpecific)) {
        return { singleDate: startOfDay(parsedSpecific) };
      }

      return { error: `Could not understand the date: "${dateDescription}"` };
    }
  } catch (error: any) {
    console.error(`Error parsing single date description "${dateDescription}":`, error);
    return { error: `Error parsing date: ${error.message}` };
  }
}

export function createAccountTools(userId: string) {
  return {
    createAccount: tool({
      description: 'Creates a new financial account (e.g., bank account, wallet) for the user.',
      parameters: z.object({
        accountName: z
          .string()
          .min(1)
          .describe("The desired name for the new account (e.g., 'ICICI Salary', 'Paytm Wallet')."),
        initialBalance: z
          .number()
          .optional()
          .describe('The starting balance (defaults to 0). Must be non-negative.'),
        currency: z
          .string()
          .length(3)
          .optional()
          .describe(
            "The 3-letter currency code (e.g., INR, USD). Defaults to user's preferred currency or INR.",
          ),
      }),
      execute: async ({ accountName, initialBalance = 0, currency }) => {
        if (initialBalance < 0) {
          return createToolResponse({
            success: false,
            error: 'Initial balance cannot be negative.',
          });
        }
        try {
          const result = await accountService.createAccount(
            userId,
            accountName,
            initialBalance,
            currency?.toUpperCase() || 'INR',
          );
          return createToolResponse({
            success: true,
            message: result.message,
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

    listAccounts: tool({
      description: "Lists the user's financial accounts, optionally filtering by name.",
      parameters: z.object({
        searchName: z
          .string()
          .optional()
          .describe('Optional: Filter accounts whose name contains this text.'),
      }),
      execute: async ({ searchName }) => {
        try {
          const result = await accountService.getAccountList(
            userId,
            1,
            100,
            'name',
            'asc',
            searchName || '',
          );
          const message =
            result.accounts.length > 0
              ? `Found ${result.accounts.length} account(s).`
              : 'No accounts found.';
          return createToolResponse({ success: true, message: message, data: result.accounts });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getAccountBalance: tool({
      description: 'Retrieves the current balance for a specific account by its name or ID.',
      parameters: z.object({
        accountIdentifier: z
          .string()
          .min(1)
          .describe('The name or ID of the account to check the balance for.'),
      }),
      execute: async ({ accountIdentifier }) => {
        try {
          const resolved = await resolveAccountId(userId, accountIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which account do you mean?',
              options: resolved.options,
            });

          const account = await accountService.getAccountById(resolved.id, userId);
          const formattedBalance = formatCurrency(account.balance ?? 0, account.currency);
          return createToolResponse({
            success: true,
            message: `Balance for ${account.name} is ${formattedBalance}.`,
            data: account,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyAccountForAction: tool({
      description:
        'Identifies a specific account by name or ID for a potential update or deletion action. Requires user confirmation before proceeding.',
      parameters: z.object({
        accountIdentifier: z.string().min(1).describe('The name or ID of the account.'),
      }),
      execute: async ({ accountIdentifier }) => {
        try {
          const resolved = await resolveAccountId(userId, accountIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which account do you want to update or delete?',
              options: resolved.options,
            });

          const account = await db.query.Account.findFirst({
            where: eq(Account.id, resolved.id),
            columns: { name: true, balance: true, currency: true },
          });
          const details = `Account: ${
            account?.name ?? accountIdentifier
          }, Balance: ${formatCurrency(account?.balance ?? 0, account?.currency)}`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Please confirm the action (update name or delete) and provide the ID (${resolved.id}). Deleting will remove all transactions.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteAccount: tool({
      description:
        'Deletes a specific financial account and all its data AFTER user confirmation, using its exact unique ID.',
      parameters: z.object({
        accountId: z
          .string()
          .describe(
            'The exact unique ID of the account to delete (obtained from the identification step).',
          ),
      }),
      execute: async ({ accountId }) => {
        try {
          const result = await accountService.deleteAccount(accountId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateAccountName: tool({
      description:
        'Updates the name of an existing financial account AFTER user confirmation, using its specific ID.',
      parameters: z.object({
        accountId: z
          .string()
          .describe(
            'The unique ID of the account to rename (obtained from the identification step).',
          ),
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
          return createToolResponse({
            success: true,
            message: `Account (ID: ${accountId}) renamed to "${newAccountName}".`,
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

export function createCategoryTools(userId: string) {
  return {
    createCategory: tool({
      description: 'Creates a new custom category for classifying transactions.',
      parameters: z.object({
        categoryName: z
          .string()
          .min(1)
          .describe("The name for the new category (e.g., 'Freelance Income', 'Office Lunch')."),
      }),
      execute: async ({ categoryName }) => {
        try {
          const newCategory = await categoryService.createCategory(userId, categoryName);
          return createToolResponse({
            success: true,
            message: `Category "${newCategory.name}" created.`,
            data: newCategory,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listCategories: tool({
      description: 'Lists all available categories for the user (custom and shared).',
      parameters: z.object({
        searchName: z
          .string()
          .optional()
          .describe('Optional: Filter categories whose name contains this text.'),
      }),
      execute: async ({ searchName }) => {
        try {
          const result = await categoryService.getCategories(
            userId,
            1,
            500,
            searchName || '',
            'name',
            'asc',
          );
          const message =
            result.categories.length > 0
              ? `Found ${result.categories.length} categories.`
              : 'No categories found.';
          return createToolResponse({ success: true, message: message, data: result.categories });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyCategoryForAction: tool({
      description:
        'Identifies a custom category by name for a potential update or deletion. Fails if transactions are associated with deletion attempt. Requires confirmation.',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('The name or ID of the custom category.'),
      }),
      execute: async ({ categoryIdentifier }) => {
        try {
          const resolved = await resolveCategoryId(userId, categoryIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which category do you want to modify or delete?',
              options: resolved.options,
            });

          const category = await db.query.Category.findFirst({
            where: eq(Category.id, resolved.id),
            columns: { name: true },
          });
          const categoryName = category?.name ?? categoryIdentifier;
          const details = `Category: ${categoryName}`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Confirm the action (update name or delete) and provide the ID (${resolved.id})? Deleting is only possible if no transactions use this category.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteCategory: tool({
      description:
        'Deletes a specific custom category AFTER user confirmation, using its exact unique ID. Fails if transactions are associated.',
      parameters: z.object({
        categoryId: z
          .string()
          .describe(
            'The exact unique ID of the category to delete (obtained from identification step).',
          ),
      }),
      execute: async ({ categoryId }) => {
        try {
          const result = await categoryService.deleteCategory(categoryId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateCategoryName: tool({
      description:
        'Updates the name of an existing custom category AFTER user confirmation, using its specific ID.',
      parameters: z.object({
        categoryId: z
          .string()
          .describe(
            'The unique ID of the custom category to rename (obtained from identification step).',
          ),
        newCategoryName: z.string().min(1).describe('The desired new name.'),
      }),
      execute: async ({ categoryId, newCategoryName }) => {
        try {
          await categoryService.updateCategory(categoryId, userId, newCategoryName);
          return createToolResponse({
            success: true,
            message: `Category (ID: ${categoryId}) renamed to "${newCategoryName}".`,
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
            "Date range ('today', 'last 7 days', 'this month', 'YYYY-MM-DD', 'YYYY-MM-DD,YYYY-MM-DD').",
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
            duration: dateDescription,
            startDate: dateRes.startDate,
            endDate: dateRes.endDate,
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
            startDate: dateRes.startDate,
            endDate: dateRes.endDate,
            minAmount: amountHint ? amountHint * 0.95 : undefined,
            maxAmount: amountHint ? amountHint * 1.05 : undefined,
            duration: dateDescription,
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
                details: `${format(parseISO(String(t.createdAt)), 'yyyy-MM-dd')}: ${t.text} (${
                  t.isIncome ? '+' : '-'
                }${formatCurrency(t.amount, t.currency)})`,
              })),
            });
          }

          const tx = result.transactions[0];
          const details = `${format(parseISO(String(tx.createdAt)), 'yyyy-MM-dd')}: ${tx.text} (${
            tx.isIncome ? '+' : '-'
          }${formatCurrency(tx.amount, tx.currency)})`;

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
  };
}

export function createBudgetTools(userId: string) {
  return {
    createBudget: tool({
      description: 'Creates a monthly budget for a specific expense category.',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('Category name or ID.'),
        amount: z.number().positive('Budget amount.'),
        month: z.number().int().min(1).max(12).describe('Month number (1-12).'),
        year: z.number().int().min(1900).max(2100).describe('Full year (e.g., 2024).'),
      }),
      execute: async ({ categoryIdentifier, amount, month, year }) => {
        try {
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

          const payload = { category: categoryRes.id, amount, month, year };
          const newBudget = await budgetService.createBudget(userId, payload as any);
          return createToolResponse({
            success: true,
            message: `Budget set for ${month}/${year}.`,
            data: newBudget,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listBudgets: tool({
      description: 'Lists existing budgets, optionally filtering by month and year.',
      parameters: z.object({
        month: z.number().int().min(1).max(12).optional().describe('Filter by month (1-12).'),
        year: z.number().int().min(1900).max(2100).optional().describe('Filter by year.'),
      }),
      execute: async ({ month, year }) => {
        try {
          const result = await budgetService.getBudgets(userId, 1, 100, 'year', 'desc');
          let filteredData = result.data;
          if (month) filteredData = filteredData.filter((b) => b.month === month);
          if (year) filteredData = filteredData.filter((b) => b.year === year);

          const message =
            filteredData.length > 0 ? `Found ${filteredData.length} budgets.` : 'No budgets found.';
          return createToolResponse({ success: true, message: message, data: filteredData });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getBudgetProgress: tool({
      description:
        'Retrieves spending progress against budget for a specific category in a given month/year (defaults to current).',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('Category name or ID.'),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe('Month (1-12), defaults to current.'),
        year: z
          .number()
          .int()
          .min(1900)
          .max(2100)
          .optional()
          .describe('Year, defaults to current.'),
      }),
      execute: async ({ categoryIdentifier, month, year }) => {
        try {
          const targetMonth = month || getMonth(new Date()) + 1;
          const targetYear = year || getYear(new Date());

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

          const budget = await db.query.Budget.findFirst({
            where: and(
              eq(Budget.userId, userId),
              eq(Budget.category, categoryRes.id),
              eq(Budget.month, targetMonth),
              eq(Budget.year, targetYear),
            ),
            columns: { id: true },
          });

          if (!budget)
            return createToolResponse({
              success: false,
              error: `No budget found for category "${categoryIdentifier}" in ${targetMonth}/${targetYear}.`,
            });

          const progressData = await budgetService.getBudgetProgress(budget.id, userId);
          return createToolResponse({ success: true, data: progressData });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getBudgetSummary: tool({
      description:
        'Retrieves the budget summary (budgeted vs actual spending) for a specified period.',
      parameters: z.object({
        period: z
          .string()
          .optional()
          .describe(
            "Period like 'this month', 'last month', '2024-08'. Defaults to current month.",
          ),
      }),
      execute: async ({ period }) => {
        try {
          let queryParams: { month?: string; year?: string; duration?: string } = {
            duration: period || 'thisMonth',
          };
          const now = new Date();
          const currentMonth = getMonth(now) + 1;
          const currentYear = getYear(now);
          const yearMonthMatch = period?.match(/^(\d{4})-(\d{1,2})$/);

          if (yearMonthMatch) {
            queryParams = { year: yearMonthMatch[1], month: yearMonthMatch[2] };
          } else if (period === 'this month' || !period) {
            queryParams = { year: String(currentYear), month: String(currentMonth) };
          }

          const summaryData = await budgetService.getBudgetSummary(userId, queryParams);
          const message =
            summaryData.length > 0 ? `Budget summary loaded.` : `No budget data found.`;
          return createToolResponse({ success: true, message, data: summaryData });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyBudgetForAction: tool({
      description:
        'Identifies a specific budget by category, month, and year for potential update or deletion. Requires confirmation.',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('Category name or ID.'),
        month: z.number().int().min(1).max(12).describe('Month (1-12).'),
        year: z.number().int().min(1900).max(2100).describe('Year (e.g., 2024).'),
      }),
      execute: async ({ categoryIdentifier, month, year }) => {
        try {
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

          const budget = await db.query.Budget.findFirst({
            where: and(
              eq(Budget.userId, userId),
              eq(Budget.category, categoryRes.id),
              eq(Budget.month, month),
              eq(Budget.year, year),
            ),
            columns: { id: true, amount: true },
            with: { category: { columns: { name: true } } },
          });

          if (!budget)
            return createToolResponse({
              success: false,
              error: `Budget not found for ${categoryRes.id} in ${month}/${year}.`,
            });

          const details = `Budget for ${
            budget.category?.name ?? categoryIdentifier
          } (${month}/${year}), Amount: ${formatCurrency(budget.amount)}`;
          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: budget.id,
            details: details,
            message: `Found ${details}. Confirm action (update amount or delete) and provide ID (${budget.id})?`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateBudget: tool({
      description:
        'Updates the amount of a specific budget AFTER confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('Exact unique ID of the budget.'),
        newAmount: z.number().positive('New positive budget amount.'),
      }),
      execute: async ({ budgetId, newAmount }) => {
        try {
          await budgetService.updateBudget(budgetId, userId, newAmount);
          return createToolResponse({
            success: true,
            message: `Budget (ID: ${budgetId}) updated.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteBudget: tool({
      description: 'Deletes a specific budget AFTER confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('Exact unique ID of the budget to delete.'),
      }),
      execute: async ({ budgetId }) => {
        try {
          const result = await budgetService.deleteBudget(budgetId, userId);
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

type GoalApiPayload = {
  name?: string;
  targetAmount?: number;
  savedAmount?: number;
  targetDate?: string | null;
};

export function createGoalTools(userId: string) {
  return {
    createSavingGoal: tool({
      description: 'Creates a new saving goal.',
      parameters: z.object({
        goalName: z.string().min(1).describe("Name of the goal (e.g., 'Vacation Fund')."),
        targetAmount: z.number().positive('Target amount to save.'),
        targetDateDescription: z
          .string()
          .optional()
          .describe("Optional target date (e.g., 'end of year', '2025-12-31')."),
      }),
      execute: async ({ goalName, targetAmount, targetDateDescription }) => {
        try {
          const dateRes = await resolveSingleDate(targetDateDescription, false);
          if (dateRes.error) return createToolResponse({ success: false, error: dateRes.error });
          const targetDate = dateRes.singleDate;

          if (targetDate && isBefore(targetDate, startOfDay(new Date()))) {
            return createToolResponse({
              success: false,
              error: 'Target date cannot be in the past.',
            });
          }

          const payload = {
            name: goalName,
            targetAmount,
            targetDate: targetDate?.toISOString() || null,
          };
          const newGoal = await goalService.createGoal(userId, payload as any);
          return createToolResponse({
            success: true,
            message: `Saving goal "${newGoal.name}" created.`,
            data: newGoal,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listSavingGoals: tool({
      description: 'Lists all current saving goals.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await goalService.getGoals(userId, 1, 100, 'targetDate', 'asc');
          const message =
            result.data.length > 0 ? `Found ${result.data.length} goals.` : 'No goals found.';
          return createToolResponse({ success: true, message: message, data: result.data });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    findSavingGoal: tool({
      description:
        'Identifies a specific saving goal by name for potential action (update, delete, add/withdraw). Requires confirmation.',
      parameters: z.object({
        goalIdentifier: z.string().min(1).describe('Name or part of the name of the goal.'),
      }),
      execute: async ({ goalIdentifier }) => {
        try {
          const resolved = await resolveSavingGoalId(userId, goalIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which saving goal?',
              options: resolved.options,
            });

          const goal = await db.query.SavingGoal.findFirst({
            where: eq(SavingGoal.id, resolved.id),
            columns: { name: true, targetAmount: true, savedAmount: true, targetDate: true },
          });
          const details = `Goal: ${goal?.name ?? goalIdentifier} (Target: ${formatCurrency(
            goal?.targetAmount ?? 0,
          )}, Saved: ${formatCurrency(goal?.savedAmount ?? 0)}, Due: ${
            goal?.targetDate ? format(parseISO(String(goal.targetDate)), 'yyyy-MM-dd') : 'N/A'
          })`;
          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Confirm action (update, delete, add/withdraw amount) and provide ID (${resolved.id})?`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateGoal: tool({
      description:
        'Updates target amount or date of a saving goal AFTER confirmation, using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('Exact unique ID of the goal.'),
        newTargetAmount: z.number().positive().optional().describe('New target amount (optional).'),
        newTargetDateDescription: z
          .string()
          .optional()
          .describe(
            "New target date (e.g., '2026-01-01', 'end of next year') (optional). Use 'null' or empty string to remove date.",
          ),
      }),
      execute: async ({ goalId, newTargetAmount, newTargetDateDescription }) => {
        try {
          const payload: Partial<GoalApiPayload> = {};
          if (newTargetAmount !== undefined) payload.targetAmount = newTargetAmount;

          if (newTargetDateDescription !== undefined) {
            if (newTargetDateDescription === null || newTargetDateDescription.trim() === '') {
              payload.targetDate = null;
            } else {
              const dateRes = await resolveSingleDate(newTargetDateDescription, false);
              if (dateRes.error || !dateRes.singleDate)
                return createToolResponse({
                  success: false,
                  error: dateRes.error || 'Invalid target date for update.',
                });
              if (isBefore(dateRes.singleDate, startOfDay(new Date())))
                return createToolResponse({
                  success: false,
                  error: 'Target date cannot be in the past.',
                });
              payload.targetDate = String(dateRes.singleDate);
            }
          }

          if (Object.keys(payload).length === 0)
            return createToolResponse({
              success: false,
              error: 'No valid fields provided for update.',
            });

          await goalService.updateGoal(goalId, userId, payload as any);
          return createToolResponse({ success: true, message: `Goal (ID: ${goalId}) updated.` });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeAddAmountToGoalById: tool({
      description: 'Adds an amount to a specific saving goal using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The exact unique ID of the saving goal.'),
        amountToAdd: z.number().positive('The amount to add.'),
      }),
      execute: async ({ goalId, amountToAdd }) => {
        try {
          await goalService.addAmountToGoal(goalId, userId, amountToAdd);
          return createToolResponse({
            success: true,
            message: `Amount added to goal (ID: ${goalId}).`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeWithdrawAmountFromGoalById: tool({
      description: 'Withdraws an amount from a specific saving goal using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The exact unique ID of the saving goal.'),
        amountToWithdraw: z.number().positive('The amount to withdraw.'),
      }),
      execute: async ({ goalId, amountToWithdraw }) => {
        try {
          await goalService.withdrawAmountFromGoal(goalId, userId, amountToWithdraw);
          return createToolResponse({
            success: true,
            message: `Amount withdrawn from goal (ID: ${goalId}).`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteGoal: tool({
      description: 'Deletes a specific saving goal AFTER confirmation, using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The exact unique ID of the goal to delete.'),
      }),
      execute: async ({ goalId }) => {
        try {
          const result = await goalService.deleteGoal(goalId, userId);
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

export function createInvestmentTools(userId: string) {
  return {
    addInvestment: tool({
      description:
        'Records a new investment holding (e.g., stock purchase) within a specific investment account.',
      parameters: z.object({
        investmentAccountIdentifier: z
          .string()
          .min(1)
          .describe('Name or ID of the investment account holding this investment.'),
        symbol: z
          .string()
          .min(1)
          .describe("The stock ticker or mutual fund symbol (e.g., 'RELIANCE.NS', 'INFY')."),
        shares: z.number().positive('Number of shares or units purchased.'),
        purchasePrice: z.number().nonnegative().describe('Price per share/unit at purchase.'),
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

type DebtUpdateApiPayload = {
  description?: string;
  duration?: string;
  frequency?: string;
};

export function createDebtTools(userId: string) {
  return {
    addDebt: tool({
      description: 'Records a new debt (money borrowed or lent). Requires associated account.',
      parameters: z.object({
        amount: z.number().positive('Principal amount.'),
        type: z.enum(['given', 'taken']).describe("'given' (lent) or 'taken' (borrowed)."),
        involvedUserIdentifier: z
          .string()
          .min(1)
          .describe('Name or email of the other person involved.'),
        description: z.string().optional().describe('Brief description (optional).'),
        interestRate: z
          .number()
          .nonnegative()
          .optional()
          .default(0)
          .describe('Annual interest rate % (default 0).'),
        interestType: z.enum(['simple', 'compound']).default('simple').describe('Interest type.'),
        accountIdentifier: z.string().min(1).describe('Name or ID of the associated account.'),
        durationType: z.enum(['year', 'month', 'week', 'day', 'custom']).describe('Duration type.'),
        frequency: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Number of duration units (required if durationType is not 'custom')."),
        customDateRangeDescription: z
          .string()
          .optional()
          .describe(
            "Specific date range 'YYYY-MM-DD,YYYY-MM-DD' (required if durationType is 'custom').",
          ),
      }),
      execute: async (args) => {
        try {
          const {
            amount,
            type,
            involvedUserIdentifier,
            description,
            interestRate = 0,
            interestType = 'simple',
            accountIdentifier,
            durationType,
            frequency,
            customDateRangeDescription,
          } = args;

          const involvedUserRes = await resolveUserId(userId, involvedUserIdentifier);
          if ('error' in involvedUserRes)
            return createToolResponse({ success: false, error: involvedUserRes.error });
          if ('clarificationNeeded' in involvedUserRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which user?',
              options: involvedUserRes.options,
            });

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

          let apiDuration: string;
          let apiFrequency: string | undefined = undefined;

          if (durationType === 'custom') {
            if (!customDateRangeDescription)
              return createToolResponse({
                success: false,
                error: 'Custom date range description is required when duration type is custom.',
              });
            const dateRes = await resolveDateRangeForQuery(customDateRangeDescription);
            if (dateRes.error || !dateRes.startDate || !dateRes.endDate)
              return createToolResponse({
                success: false,
                error: dateRes.error || 'Invalid custom date range.',
              });
            apiDuration = `${format(dateRes.startDate, 'yyyy-MM-dd')},${format(
              dateRes.endDate,
              'yyyy-MM-dd',
            )}`;
          } else {
            if (!frequency)
              return createToolResponse({
                success: false,
                error: 'Frequency is required for non-custom duration types.',
              });
            apiDuration = durationType;
            apiFrequency = String(frequency);
          }

          const payload = {
            amount,
            type,
            user: involvedUserRes.id,
            description,
            interestType,
            percentage: interestRate,
            account: accountRes.id,
            duration: apiDuration,
            frequency: apiFrequency,
          };
          const newDebt = await debtService.createDebt(userId, payload as any);
          return createToolResponse({
            success: true,
            message: `Debt (${type}) recorded.`,
            data: newDebt,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listDebts: tool({
      description: 'Lists debts (given or taken). Can filter by type.',
      parameters: z.object({
        type: z.enum(['given', 'taken']).optional().describe("Filter by 'given' or 'taken'."),
      }),
      execute: async ({ type }) => {
        try {
          const result = await debtService.getDebts(userId, { type }, 1, 100, 'dueDate', 'asc');
          const message =
            result.data.length > 0 ? `Found ${result.data.length} debts.` : 'No debts found.';
          return createToolResponse({ success: true, message: message, data: result.data });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    markDebtAsPaid: tool({
      description:
        'Identifies a debt by description/counterparty and asks for confirmation to mark it paid.',
      parameters: z.object({
        debtIdentifier: z
          .string()
          .min(1)
          .describe("Information to identify the debt (e.g., 'loan from john')."),
      }),
      execute: async ({ debtIdentifier }) => {
        try {
          const resolved = await resolveDebtId(userId, debtIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which debt do you want to mark as paid?',
              options: resolved.options,
            });

          const debt = await db.query.Debts.findFirst({
            where: eq(Debts.id, resolved.id),
            with: { involvedUser: { columns: { name: true } } },
          });
          const details = `Debt: ${debt?.description ?? debtIdentifier} involving ${
            debt?.involvedUser?.name ?? 'Unknown'
          }`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Mark this debt (ID: ${resolved.id}) as paid? Please confirm by providing the ID.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedMarkDebtPaid: tool({
      description:
        'Marks a specific debt as paid AFTER user confirmation, using its exact unique ID.',
      parameters: z.object({
        debtId: z.string().describe('The exact unique ID of the debt to mark paid.'),
      }),
      execute: async ({ debtId }) => {
        try {
          const result = await debtService.markDebtAsPaid(debtId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyDebtForAction: tool({
      description:
        'Identifies a specific debt by description/counterparty for potential update or deletion. Requires confirmation.',
      parameters: z.object({
        debtIdentifier: z
          .string()
          .min(1)
          .describe("Information to identify the debt (e.g., 'loan from john')."),
      }),
      execute: async ({ debtIdentifier }) => {
        try {
          const resolved = await resolveDebtId(userId, debtIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which debt?',
              options: resolved.options,
            });

          const debt = await db.query.Debts.findFirst({
            where: eq(Debts.id, resolved.id),
            with: { involvedUser: { columns: { name: true } } },
          });
          const details = `Debt: ${debt?.description ?? debtIdentifier} (w/ ${
            debt?.involvedUser?.name ?? 'Unknown'
          }, Type: ${debt?.type}, Paid: ${debt?.isPaid})`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Confirm action (update description/duration or delete) and provide ID (${resolved.id})?`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateDebt: tool({
      description:
        'Updates description or duration/frequency of a debt AFTER confirmation, using its unique ID.',
      parameters: z.object({
        debtId: z.string().describe('Exact unique ID of the debt.'),
        newDescription: z.string().optional().describe('New description (optional).'),
        newDurationType: z
          .enum(['year', 'month', 'week', 'day', 'custom'])
          .optional()
          .describe('New duration type (optional).'),
        newFrequency: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("New number of duration units (required if newDurationType is not 'custom')."),
        newCustomDateRangeDescription: z
          .string()
          .optional()
          .describe(
            "New date range 'YYYY-MM-DD,YYYY-MM-DD' (required if newDurationType is 'custom').",
          ),
      }),
      execute: async (args) => {
        const {
          debtId,
          newDescription,
          newDurationType,
          newFrequency,
          newCustomDateRangeDescription,
        } = args;
        try {
          const payload: Partial<DebtUpdateApiPayload> = {};
          if (newDescription) payload.description = newDescription;

          if (newDurationType) {
            if (newDurationType === 'custom') {
              if (!newCustomDateRangeDescription)
                return createToolResponse({
                  success: false,
                  error: "Custom date range description is required for 'custom' duration type.",
                });
              const dateRes = await resolveDateRangeForQuery(newCustomDateRangeDescription);
              if (dateRes.error || !dateRes.startDate || !dateRes.endDate)
                return createToolResponse({
                  success: false,
                  error: dateRes.error || 'Invalid custom date range for update.',
                });
              payload.duration = `${format(dateRes.startDate, 'yyyy-MM-dd')},${format(
                dateRes.endDate,
                'yyyy-MM-dd',
              )}`;
              payload.frequency = undefined;
            } else {
              if (!newFrequency)
                return createToolResponse({
                  success: false,
                  error: 'Frequency is required for non-custom duration types.',
                });
              payload.duration = newDurationType;
              payload.frequency = String(newFrequency);
            }
          } else if (newFrequency && !newDurationType) {
            const existingDebt = await db.query.Debts.findFirst({
              where: eq(Debts.id, debtId),
              columns: { duration: true },
            });
            if (existingDebt?.duration && !existingDebt.duration.includes(',')) {
              payload.frequency = String(newFrequency);
            } else {
              return createToolResponse({
                success: false,
                error:
                  "Duration type must be provided when updating frequency, or current type is 'custom'.",
              });
            }
          }

          if (Object.keys(payload).length === 0)
            return createToolResponse({
              success: false,
              error: 'No valid update fields provided.',
            });

          await debtService.updateDebt(debtId, userId, payload);
          return createToolResponse({ success: true, message: `Debt (ID: ${debtId}) updated.` });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteDebt: tool({
      description: 'Deletes a specific debt AFTER confirmation, using its unique ID.',
      parameters: z.object({
        debtId: z.string().describe('Exact unique ID of the debt to delete.'),
      }),
      execute: async ({ debtId }) => {
        try {
          const result = await debtService.deleteDebt(debtId, userId);
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
