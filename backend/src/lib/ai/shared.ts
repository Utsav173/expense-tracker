import { debtService } from '../../services/debt.service';
import { parseNaturalLanguageDateRange } from '../../utils/nl_date.utils';
import {
  startOfDay,
  isValid as isValidDateFn,
  parseISO,
  isEqual,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { and, eq, ilike, ne, or } from 'drizzle-orm';
import { Category, SavingGoal, User, InvestmentAccount, Account } from '../../database/schema';
import { db } from '../../database';

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

export type ResolverResponse =
  | { id: string }
  | { clarificationNeeded: true; options: { id: string; name?: string; description?: string }[] }
  | { error: string };

export async function resolveAccountId(
  userId: string,
  identifier: string,
): Promise<ResolverResponse> {
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

export async function resolveCategoryId(
  userId: string,
  identifier: string,
): Promise<ResolverResponse> {
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

export async function resolveSavingGoalId(
  userId: string,
  identifier: string,
): Promise<ResolverResponse> {
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

export async function resolveDebtId(userId: string, identifier: string): Promise<ResolverResponse> {
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

export async function resolveSingleDate(
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
