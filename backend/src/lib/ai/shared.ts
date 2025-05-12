import { parseNaturalLanguageDateRange } from '../../utils/nl_date.utils';
import {
  startOfDay,
  isValid as isValidDateFn,
  parseISO,
  isEqual,
  endOfDay,
  startOfMonth,
  endOfMonth,
  format as formatDateFn,
} from 'date-fns';
import { and, eq, ilike, ne, or } from 'drizzle-orm';
import {
  Category,
  SavingGoal,
  User,
  InvestmentAccount,
  Account,
  Debts,
} from '../../database/schema';
import { db } from '../../database';
import { HTTPException } from 'hono/http-exception';
import { formatCurrency } from '../../utils/currency.utils';

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

export const createToolResponse = (response: ToolResponse): string => {
  try {
    return JSON.stringify(response);
  } catch (e) {
    console.error('Error stringifying tool response:', e);
    return JSON.stringify({ success: false, error: 'Internal error formatting tool result.' });
  }
};

export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred.',
): string {
  let message = defaultMessage;
  if (error instanceof HTTPException) {
    const response = error.getResponse();
    if (response && typeof response === 'object' && 'message' in response) {
      message = (response as any).message;
    } else {
      message = error.message || `HTTP Error: ${error.status}`;
    }
    console.error(`HTTP Exception in tool: ${message}`, error);
  } else if (error instanceof Error) {
    message = error.message;
    console.error(`Error in tool: ${message}`, error);
  } else {
    console.error('Unknown error in tool:', error);
  }
  return createToolResponse({ success: false, error: message });
}

export type ResolverResponse =
  | { id: string; name?: string; currency?: string; balance?: number }
  | {
      clarificationNeeded: true;
      options: {
        id: string;
        name?: string;
        description?: string;
        currency?: string;
        details?: string;
        balance?: number;
      }[];
    }
  | { error: string };

export async function resolveAccountId(
  userId: string,
  identifier?: string | null,
): Promise<ResolverResponse> {
  try {
    if (!identifier || identifier.trim() === '') {
      const defaultAccount = await db.query.Account.findFirst({
        where: and(eq(Account.owner, userId), eq(Account.isDefault, true)),
        columns: { id: true, name: true, currency: true, balance: true },
      });
      if (defaultAccount) {
        return {
          id: defaultAccount.id,
          name: defaultAccount.name,
          currency: defaultAccount.currency,
          balance: defaultAccount.balance ?? 0,
        };
      }
      return {
        error:
          'No account specified and no default account found. Please specify an account or set a default.',
      };
    }

    const accounts = await db.query.Account.findMany({
      where: and(eq(Account.owner, userId), ilike(Account.name, `%${identifier.trim()}%`)),
      columns: { id: true, name: true, currency: true, balance: true },
      limit: 5,
    });

    if (accounts.length === 0)
      return {
        error: `No account found matching "${identifier}". Please check the name or create a new account.`,
      };
    if (accounts.length === 1)
      return {
        id: accounts[0].id,
        name: accounts[0].name,
        currency: accounts[0].currency,
        balance: accounts[0].balance ?? 0,
      };

    const exactMatch = accounts.find(
      (acc) => acc.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatch)
      return {
        id: exactMatch.id,
        name: exactMatch.name,
        currency: exactMatch.currency,
        balance: exactMatch.balance ?? 0,
      };

    return {
      clarificationNeeded: true,
      options: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        details: `${a.name} (${formatCurrency(a.balance ?? 0, a.currency)})`,
        currency: a.currency,
        balance: a.balance ?? 0,
      })),
    };
  } catch (error: any) {
    console.error(`Error resolving account ID for "${identifier}":`, error);
    return { error: `Failed to resolve account: ${error.message}` };
  }
}

export async function resolveCategoryId(
  userId: string,
  identifier?: string | null,
  transactionDescription?: string,
): Promise<ResolverResponse> {
  if (!identifier || identifier.trim() === '') {
    if (transactionDescription) {
      const descriptionLower = transactionDescription.toLowerCase();
      const userCategories = await db.query.Category.findMany({
        where: eq(Category.owner, userId),
        columns: { id: true, name: true },
      });

      for (const cat of userCategories) {
        if (descriptionLower.includes(cat.name.toLowerCase())) {
          return { id: cat.id, name: cat.name };
        }
      }
      const keywordMap: Record<string, string[]> = {
        food: [
          'groceries',
          'restaurant',
          'dining',
          'lunch',
          'dinner',
          'coffee',
          'starbucks',
          'swiggy',
          'zomato',
        ],
        transport: ['uber', 'ola', 'taxi', 'bus', 'metro', 'petrol', 'fuel', 'gas', 'cab', 'auto'],
        utilities: ['electricity', 'water', 'internet', 'bill', 'phone', 'recharge'],
        shopping: ['amazon', 'flipkart', 'clothing', 'shoes', 'apparel', 'mall', 'online shopping'],
        entertainment: ['movie', 'concert', 'ott', 'netflix', 'spotify', 'tickets', 'show'],
        salary: ['salary', 'income', 'payment received', 'earnings'],
        rent: ['rent', 'emi', 'housing', 'mortgage'],
        medical: ['doctor', 'pharmacy', 'hospital', 'medicine', 'clinic'],
        travel: ['travel', 'flight', 'hotel', 'vacation', 'trip'],
        education: ['school', 'college', 'tuition', 'books', 'course'],
        gifts: ['gift', 'present'],
        personal_care: ['salon', 'haircut', 'spa', 'cosmetics'],
      };
      for (const categoryNameKey in keywordMap) {
        if (keywordMap[categoryNameKey].some((keyword) => descriptionLower.includes(keyword))) {
          const foundCat =
            userCategories.find((c) =>
              c.name.toLowerCase().includes(categoryNameKey.replace('_', ' ')),
            ) ||
            (await db.query.Category.findFirst({
              where: and(
                eq(Category.owner, userId),
                ilike(Category.name, `%${categoryNameKey.replace('_', ' ')}%`),
              ),
            }));
          if (foundCat) return { id: foundCat.id, name: foundCat.name };
        }
      }
    }

    let defaultCategory = await db.query.Category.findFirst({
      where: and(
        eq(Category.owner, userId),
        or(ilike(Category.name, 'Uncategorized'), ilike(Category.name, 'Miscellaneous')),
      ),
      columns: { id: true, name: true },
    });
    if (!defaultCategory) {
      try {
        const createdDefault = await db
          .insert(Category)
          .values({ name: 'Uncategorized', owner: userId })
          .returning();
        if (createdDefault.length > 0) defaultCategory = createdDefault[0];
      } catch (dbError) {
        console.error(
          "Failed to create default 'Uncategorized' category for user:",
          userId,
          dbError,
        );
      }
    }
    if (defaultCategory) return { id: defaultCategory.id, name: defaultCategory.name };

    return {
      error:
        'Category is required and could not be inferred. Please specify a category or create an "Uncategorized" one.',
    };
  }

  try {
    const categories = await db.query.Category.findMany({
      where: and(eq(Category.owner, userId), ilike(Category.name, `%${identifier.trim()}%`)),
      columns: { id: true, name: true },
      limit: 5,
    });

    if (categories.length === 0)
      return {
        error: `No category found matching "${identifier}". Please check the name or create a new one.`,
      };
    if (categories.length === 1) return { id: categories[0].id, name: categories[0].name };

    const exactMatch = categories.find(
      (cat) => cat.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatch) return { id: exactMatch.id, name: exactMatch.name };

    return {
      clarificationNeeded: true,
      options: categories.map((c) => ({ id: c.id, name: c.name, details: `Category: ${c.name}` })),
    };
  } catch (error: any) {
    console.error(`Error resolving category ID for "${identifier}":`, error);
    return { error: `Failed to resolve category: ${error.message}` };
  }
}

export async function resolveInvestmentAccountId(
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
      columns: { id: true, name: true, currency: true, platform: true },
      limit: 5,
    });

    if (accounts.length === 0)
      return {
        error: `No investment account found matching "${identifier}". Check name or create one.`,
      };
    if (accounts.length === 1)
      return {
        id: accounts[0].id,
        name: accounts[0].name,
        currency: accounts[0].currency || undefined,
      };

    const exactMatch = accounts.find(
      (acc) => acc.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatch)
      return {
        id: exactMatch.id,
        name: exactMatch.name,
        currency: exactMatch.currency || undefined,
      };

    return {
      clarificationNeeded: true,
      options: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        details: `${a.name} (${a.platform || 'N/A'}, ${a.currency || 'N/A'})`,
        currency: a.currency || undefined,
      })),
    };
  } catch (error: any) {
    console.error(`Error resolving investment account ID for "${identifier}":`, error);
    return { error: `Failed to resolve investment account: ${error.message}` };
  }
}

export async function resolveSavingGoalId(
  userId: string,
  identifier: string,
): Promise<ResolverResponse> {
  if (!identifier || !identifier.trim()) return { error: 'Goal identifier is required.' };
  try {
    const goals = await db.query.SavingGoal.findMany({
      where: and(eq(SavingGoal.userId, userId), ilike(SavingGoal.name, `%${identifier.trim()}%`)),
      columns: { id: true, name: true, targetAmount: true, savedAmount: true, targetDate: true },
      limit: 5,
    });

    if (goals.length === 0) return { error: `No saving goal found matching "${identifier}".` };
    if (goals.length === 1) return { id: goals[0].id, name: goals[0].name };

    const exactMatch = goals.find(
      (goal) => goal.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatch) return { id: exactMatch.id, name: exactMatch.name };

    return {
      clarificationNeeded: true,
      options: goals.map((g) => ({
        id: g.id,
        name: g.name,
        details: `Goal: ${g.name} (Target: ${formatCurrency(
          g.targetAmount ?? 0,
        )}, Saved: ${formatCurrency(g.savedAmount ?? 0)}, Due: ${
          g.targetDate ? formatDateFn(new Date(g.targetDate), 'MMM d, yyyy') : 'N/A'
        })`,
      })),
    };
  } catch (error: any) {
    console.error(`Error resolving goal ID for "${identifier}":`, error);
    return { error: `Failed to resolve goal: ${error.message}` };
  }
}

export async function resolveDebtId(userId: string, identifier: string): Promise<ResolverResponse> {
  if (!identifier || !identifier.trim()) return { error: 'Debt identifier is required.' };
  try {
    const debts = await db
      .select({
        id: Debts.id,
        description: Debts.description,
        type: Debts.type,
        amount: Debts.amount,
        isPaid: Debts.isPaid,
        involvedUserName: User.name,
        accountCurrency: Account.currency,
      })
      .from(Debts)
      .leftJoin(User, eq(Debts.userId, User.id))
      .leftJoin(Account, eq(Debts.account, Account.id))
      .where(
        and(
          or(eq(Debts.createdBy, userId), eq(Debts.userId, userId)),
          or(
            ilike(Debts.description, `%${identifier.trim()}%`),
            ilike(User.name, `%${identifier.trim()}%`),
          ),
        ),
      )
      .limit(5);

    if (debts.length === 0) return { error: `No debt record found matching "${identifier}".` };
    if (debts.length === 1) return { id: debts[0].id, name: debts[0].description || undefined };

    return {
      clarificationNeeded: true,
      options: debts.map((d) => ({
        id: d.id,
        name: d.description || `Debt with ${d.involvedUserName || 'Unknown'}`,
        details: `${d.type === 'taken' ? 'Borrowed' : 'Lent'} ${formatCurrency(
          d.amount,
          d.accountCurrency || undefined,
        )} ${d.description ? `for "${d.description}"` : ''} (with ${
          d.involvedUserName || 'Unknown'
        }) - ${d.isPaid ? 'Paid' : 'Unpaid'}`,
      })),
    };
  } catch (error: any) {
    console.error(`Error resolving debt ID for "${identifier}":`, error);
    return { error: `Failed to resolve debt: ${error.message}` };
  }
}

export async function resolveUserId(
  currentUserId: string,
  identifier: string,
): Promise<ResolverResponse> {
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

    if (users.length === 0)
      return { error: `No active user found matching "${identifier}" (excluding yourself).` };
    if (users.length === 1) return { id: users[0].id, name: users[0].name };

    const exactMatchName = users.find(
      (u) => u.name.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatchName) return { id: exactMatchName.id, name: exactMatchName.name };
    const exactMatchEmail = users.find(
      (u) => u.email.toLowerCase() === identifier.trim().toLowerCase(),
    );
    if (exactMatchEmail) return { id: exactMatchEmail.id, name: exactMatchEmail.name };

    return {
      clarificationNeeded: true,
      options: users.map((u) => ({ id: u.id, name: u.name, details: `${u.name} (${u.email})` })),
    };
  } catch (error: any) {
    console.error(`Error resolving user ID for "${identifier}":`, error);
    return { error: `Failed to resolve user: ${error.message}` };
  }
}

export type DateResolverResponse = {
  startDate?: Date;
  endDate?: Date;
  error?: string;
  singleDate?: Date;
};

export async function resolveDateRangeForQuery(
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
    if (
      range?.startDate &&
      range?.endDate &&
      isValidDateFn(range.startDate) &&
      isValidDateFn(range.endDate)
    ) {
      const endDateAdjusted = endOfDay(range.endDate);
      return { startDate: range.startDate, endDate: endDateAdjusted };
    } else {
      return {
        error: `Could not understand the date/period: "${dateDescription}". Please be more specific or use YYYY-MM-DD format.`,
      };
    }
  } catch (error: any) {
    console.error(`Error parsing date description "${dateDescription}":`, error);
    return { error: `Error parsing date: ${error.message}` };
  }
}

export async function resolveSingleDate(
  dateDescription?: string | null,
  defaultToToday: boolean = true,
): Promise<DateResolverResponse> {
  const now = new Date();
  const defaultDate = defaultToToday ? startOfDay(now) : undefined;

  if (!dateDescription || dateDescription.trim() === '') {
    return defaultDate ? { singleDate: defaultDate } : { error: 'Date description is required.' };
  }

  try {
    const range = parseNaturalLanguageDateRange(dateDescription);
    if (range?.startDate && isValidDateFn(range.startDate)) {
      if (range.endDate && !isEqual(startOfDay(range.startDate), startOfDay(range.endDate))) {
        return {
          error: `Expected a single date but received a range for "${dateDescription}". Please be more specific (e.g., 'today', 'yesterday', 'YYYY-MM-DD').`,
        };
      }
      return { singleDate: startOfDay(range.startDate) };
    } else {
      const parsedSpecific = parseISO(dateDescription);
      if (isValidDateFn(parsedSpecific)) {
        return { singleDate: startOfDay(parsedSpecific) };
      }
      return {
        error: `Could not understand the date: "${dateDescription}". Please use a common phrase like 'today', 'last Tuesday', or YYYY-MM-DD format.`,
      };
    }
  } catch (error: any) {
    console.error(`Error parsing single date description "${dateDescription}":`, error);
    return { error: `Error parsing date: ${error.message}` };
  }
}
