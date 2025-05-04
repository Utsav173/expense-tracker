import { db } from '../database';
import { Account, Debts, User } from '../database/schema';
import {
  InferInsertModel,
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  lt,
  or,
  AnyColumn,
} from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { differenceInDays, parseISO, isValid as isValidDate } from 'date-fns';
import { getIntervalValue } from '../utils/date.utils';

type DebtFilters = {
  duration?: string;
  q?: string;
  type?: 'given' | 'taken';
};

export class DebtService {
  calculateInterest(
    amount: number,
    percentage: number,
    duration: any,
    type: 'simple' | 'compound',
    compoundingFrequency = 1,
  ) {
    const amountValue = Number(amount);
    const percentageValue = Number(percentage);

    if (isNaN(amountValue) || isNaN(percentageValue) || amountValue <= 0 || percentageValue < 0) {
      throw new HTTPException(400, { message: 'Invalid amount or percentage.' });
    }
    if (type === 'compound' && (isNaN(compoundingFrequency) || compoundingFrequency <= 0)) {
      throw new HTTPException(400, {
        message: 'Compounding frequency must be a positive number for compound interest.',
      });
    }

    let timeDiffInYears: number;
    if (duration && typeof duration === 'string' && duration.includes(',')) {
      const [startDateString, endDateString] = duration.split(',');
      const startDate = parseISO(startDateString);
      const endDate = parseISO(endDateString);

      if (!isValidDate(startDate) || !isValidDate(endDate) || startDate >= endDate) {
        throw new HTTPException(400, {
          message: 'Invalid date range format or start date is not before end date',
        });
      }
      timeDiffInYears = differenceInDays(endDate, startDate) / 365.25;
    } else if (
      typeof duration === 'string' &&
      ['year', 'month', 'week', 'day'].includes(duration)
    ) {
      // Need a frequency (number of units) to calculate duration from simple string like 'year'
      throw new HTTPException(400, {
        message: 'Frequency number is required when duration is a unit (year, month, etc.).',
      });
      // If frequency was passed separately, you'd use it here:
      // const freqNum = Number(frequency); // Assuming frequency was passed
      // if (isNaN(freqNum) || freqNum <= 0) throw new HTTPException(400, { message: 'Invalid frequency number.' });
      // switch (duration) { /* calculate timeDiffInYears based on freqNum */ }
    } else if (typeof duration === 'number') {
      // Assume duration is number of years if just a number
      timeDiffInYears = duration;
    } else {
      throw new HTTPException(400, { message: 'Invalid or missing duration.' });
    }

    let totalAmount: number;
    let interest: number;

    if (type === 'simple') {
      interest = amountValue * (percentageValue / 100) * timeDiffInYears;
      totalAmount = amountValue + interest;
    } else {
      // compound
      const n = compoundingFrequency; // Use the provided frequency
      totalAmount = amountValue * Math.pow(1 + percentageValue / 100 / n, n * timeDiffInYears);
      interest = totalAmount - amountValue;
    }

    return {
      interest: parseFloat(interest.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }

  async createDebt(
    ownerId: string,
    payload: {
      amount: number;
      premiumAmount: number;
      description: string;
      duration: string;
      percentage: number;
      frequency: string;
      user: string;
      type: 'given' | 'taken';
      interestType: 'simple' | 'compound';
      account: string;
    },
  ) {
    const {
      amount,
      premiumAmount = 0,
      description,
      duration,
      percentage = 0,
      frequency,
      user: involvedUserId,
      type,
      interestType,
      account,
    } = payload;

    // --- Input Validation ---
    const amountValue = Number(amount);
    const premiumAmountValue = Number(premiumAmount);
    const percentageValue = Number(percentage);

    if (isNaN(amountValue) || amountValue <= 0)
      throw new HTTPException(400, { message: 'Invalid amount.' });
    if (isNaN(premiumAmountValue) || premiumAmountValue < 0)
      throw new HTTPException(400, { message: 'Invalid premium amount.' });
    if (isNaN(percentageValue) || percentageValue < 0)
      throw new HTTPException(400, { message: 'Invalid percentage.' });

    // --- Date & Duration Logic ---
    let calculatedDueDate: Date | null = null;
    let durationValue: string | null = null;
    let frequencyValue: string | null = null;

    if (duration && typeof duration === 'string' && duration.includes(',')) {
      const [startDateString, endDateString] = duration.split(',');
      const startDate = parseISO(startDateString);
      const endDate = parseISO(endDateString);
      if (!isValidDate(startDate) || !isValidDate(endDate) || startDate >= endDate) {
        throw new HTTPException(400, { message: 'Invalid date range format or order.' });
      }
      calculatedDueDate = endDate;
      durationValue = duration; // Store the range string
      frequencyValue = null; // Frequency doesn't apply to a range
    } else if (
      duration &&
      typeof duration === 'string' &&
      ['year', 'month', 'week', 'day'].includes(duration)
    ) {
      const freqNum = Number(frequency);
      if (isNaN(freqNum) || freqNum <= 0) {
        throw new HTTPException(400, {
          message: 'Frequency (number of units) required for duration units.',
        });
      }
      frequencyValue = String(freqNum);
      durationValue = duration; // Store the unit 'year', 'month', etc.
      const now = new Date();
      switch (duration) {
        case 'year':
          calculatedDueDate = new Date(now.setFullYear(now.getFullYear() + freqNum));
          break;
        case 'month':
          calculatedDueDate = new Date(now.setMonth(now.getMonth() + freqNum));
          break;
        case 'week':
          calculatedDueDate = new Date(now.setDate(now.getDate() + 7 * freqNum));
          break;
        case 'day':
          calculatedDueDate = new Date(now.setDate(now.getDate() + freqNum));
          break;
      }
    } else if (duration) {
      throw new HTTPException(400, { message: 'Invalid duration format.' });
    }

    // --- Existence Checks ---
    const involvedUserExists = await db.query.User.findFirst({
      where: eq(User.id, involvedUserId),
      columns: { id: true },
    });
    if (!involvedUserExists) throw new HTTPException(404, { message: 'Involved user not found.' });

    if (account) {
      // Account is optional for debts
      const accountExists = await db.query.Account.findFirst({
        where: and(eq(Account.id, account), eq(Account.owner, ownerId)),
        columns: { id: true },
      });
      if (!accountExists)
        throw new HTTPException(404, {
          message: 'Associated account not found or does not belong to you.',
        });
    }

    // --- Database Insertion ---
    const newDebt = await db
      .insert(Debts)
      .values({
        amount: amountValue,
        createdBy: ownerId,
        percentage: percentageValue,
        premiumAmount: premiumAmountValue,
        type,
        userId: involvedUserId,
        account: account ?? null, // Handle optional account
        description,
        dueDate: calculatedDueDate?.toISOString().split('T')[0], // Format date
        duration: durationValue,
        frequency: frequencyValue,
        interestType,
        isPaid: false, // Default isPaid to false
        createdAt: new Date(), // Set creation time
      })
      .returning()
      .catch((err) => {
        console.error('Error creating debt:', err);
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    if (!newDebt || newDebt.length === 0) {
      throw new HTTPException(500, { message: 'Failed to create debt record.' });
    }

    return newDebt[0];
  }

  async getDebts(
    userId: string,
    filters: DebtFilters,
    page: number,
    pageSize: number,
    sortBy: string,
    sortOrder: string,
  ) {
    const sortColumnMap: Record<string, AnyColumn | SQL> = {
      amount: Debts.amount,
      'debts.amount': Debts.amount,
      premiumAmount: Debts.premiumAmount,
      'debts.premiumAmount': Debts.premiumAmount,
      description: Debts.description,
      'debts.description': Debts.description,
      createdAt: Debts.createdAt,
      'debts.createdAt': Debts.createdAt,
      dueDate: Debts.dueDate,
      'debts.dueDate': Debts.dueDate,
      percentage: Debts.percentage,
      'debts.percentage': Debts.percentage,
      frequency: Debts.frequency,
      'debts.frequency': Debts.frequency,
      isPaid: Debts.isPaid,
      'debts.isPaid': Debts.isPaid,
      type: Debts.type,
      'debts.type': Debts.type,
      interestType: Debts.interestType,
      'debts.interestType': Debts.interestType,
      'account.name': Account.name,
      'user.name': User.name,
    };
    const sortColumn = sortColumnMap[sortBy] || Debts.createdAt;
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? asc : desc;
    const orderByClause = sortDirection(sortColumn as AnyColumn | SQL);

    // Base query: fetch debts created by the user OR where the user is the involved party
    let query: SQL<unknown> | undefined = or(eq(Debts.createdBy, userId), eq(Debts.userId, userId));

    // Apply Duration Filter
    if (filters.duration && filters.duration.trim().length > 0) {
      try {
        const { endDate, startDate } = await getIntervalValue(filters.duration);
        query = and(
          query,
          and(gt(Debts.createdAt, new Date(startDate)), lt(Debts.createdAt, new Date(endDate))),
        );
      } catch (e) {
        throw new HTTPException(400, { message: 'Invalid duration format.' });
      }
    }

    // Apply Search Filter (q)
    if (filters.q && filters.q.trim().length > 0) {
      const searchNum = Number(filters.q);
      const amountFilter = !isNaN(searchNum)
        ? or(eq(Debts.amount, searchNum), eq(Debts.premiumAmount, searchNum))
        : undefined;
      query = and(
        query,
        or(
          ilike(Debts.description, `%${filters.q}%`),
          // Consider searching involved user's name (requires join)
          ilike(User.name, `%${filters.q}%`), // Join with User table on Debts.userId
          // Consider searching account name (requires join)
          ilike(Account.name, `%${filters.q}%`), // Join with Account table on Debts.account
          amountFilter,
        ),
      );
    }

    // Apply Type Filter
    if (filters.type && (filters.type === 'given' || filters.type === 'taken')) {
      query = and(query, eq(Debts.type, filters.type));
    }

    const finalQuery = query;

    // Count total matching records
    const totalCountResult = await db
      .select({ count: count() })
      .from(Debts)
      .leftJoin(User, eq(Debts.userId, User.id)) // Joined for search/sort
      .leftJoin(Account, eq(Debts.account, Account.id)) // Joined for search/sort
      .where(finalQuery)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });
    const totalCount = totalCountResult[0]?.count ?? 0;

    // Fetch paginated data
    const debts = await db
      .select({
        debts: Debts,
        account: {
          id: Account.id,
          name: Account.name,
          currency: Account.currency,
        },
        user: {
          id: User.id,
          name: User.name,
          email: User.email,
          profilePic: User.profilePic,
        },
      })
      .from(Debts)
      .leftJoin(Account, eq(Debts.account, Account.id))
      .leftJoin(User, eq(Debts.userId, User.id)) // Renamed alias for clarity
      .where(finalQuery)
      .limit(pageSize)
      .offset(pageSize * (page - 1))
      .orderBy(orderByClause)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
      });

    return {
      data: debts,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / +pageSize),
      currentPage: +page,
      pageSize: +pageSize,
    };
  }

  async updateDebt(
    debtId: string,
    userId: string,
    payload: Partial<
      Pick<InferInsertModel<typeof Debts>, 'description' | 'isPaid' | 'duration' | 'frequency'>
    >,
  ) {
    const { description, isPaid, duration, frequency } = payload;

    const existingDebt = await db.query.Debts.findFirst({
      where: eq(Debts.id, debtId),
      columns: { createdBy: true, userId: true }, // Need userId to check if involved party can mark paid
    });

    if (!existingDebt) {
      throw new HTTPException(404, { message: 'Debt record not found.' });
    }

    // Authorization: Only creator can modify description, duration, frequency
    // Either creator OR involved user can mark as paid
    const canModifyDetails = existingDebt.createdBy === userId;
    const canMarkPaid = existingDebt.createdBy === userId || existingDebt.userId === userId;

    const updateData: Partial<InferInsertModel<typeof Debts>> = { updatedAt: new Date() };

    if (description !== undefined) {
      if (!canModifyDetails)
        throw new HTTPException(403, { message: 'Permission denied to modify description.' });
      updateData.description = description;
    }
    if (duration !== undefined) {
      if (!canModifyDetails)
        throw new HTTPException(403, { message: 'Permission denied to modify duration.' });
      // Add validation for duration format if necessary
      updateData.duration = duration;
    }
    if (frequency !== undefined) {
      if (!canModifyDetails)
        throw new HTTPException(403, { message: 'Permission denied to modify frequency.' });
      updateData.frequency = String(frequency); // Ensure it's stored as string if needed
    }
    if (isPaid !== undefined) {
      if (!canMarkPaid)
        throw new HTTPException(403, { message: 'Permission denied to mark this debt as paid.' });
      updateData.isPaid = Boolean(isPaid);
    }

    if (Object.keys(updateData).length === 1) {
      // Only updatedAt
      return { message: 'No changes provided.' }; // Or return current state?
    }

    const updated = await db
      .update(Debts)
      .set(updateData)
      .where(eq(Debts.id, debtId))
      .returning({ id: Debts.id });

    if (updated.length === 0) {
      throw new HTTPException(500, { message: 'Failed to update debt record.' });
    }

    return { message: 'Debt updated successfully' };
  }

  async deleteDebt(debtId: string, userId: string) {
    // Verify the user created the debt before deleting
    const existingDebt = await db.query.Debts.findFirst({
      where: and(eq(Debts.id, debtId), eq(Debts.createdBy, userId)),
      columns: { id: true }, // Just need to confirm existence and ownership
    });

    if (!existingDebt) {
      throw new HTTPException(404, {
        message: 'Debt record not found or you do not have permission to delete it.',
      });
    }

    const deleted = await db.delete(Debts).where(eq(Debts.id, debtId)).returning({ id: Debts.id });

    if (deleted.length === 0) {
      // This should theoretically not happen if the check above passed, but good to have
      throw new HTTPException(500, { message: 'Failed to delete debt record.' });
    }

    return { message: 'Debt deleted successfully' };
  }

  async markDebtAsPaid(debtId: string, userId: string) {
    // Verify the user is either the creator or the involved party
    const existingDebt = await db.query.Debts.findFirst({
      where: and(eq(Debts.id, debtId), or(eq(Debts.createdBy, userId), eq(Debts.userId, userId))),
      columns: { id: true }, // Just need to confirm existence and authorization
    });

    if (!existingDebt) {
      throw new HTTPException(404, {
        message: 'Debt record not found or you do not have permission to mark it as paid.',
      });
    }

    const updated = await db
      .update(Debts)
      .set({ isPaid: true, updatedAt: new Date() })
      .where(eq(Debts.id, debtId))
      .returning({ id: Debts.id });

    if (updated.length === 0) {
      throw new HTTPException(500, { message: 'Failed to mark debt as paid.' });
    }

    return { message: 'Debt marked as paid' };
  }
}

export const debtService = new DebtService();
