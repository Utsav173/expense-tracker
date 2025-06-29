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
import {
  differenceInDays,
  parseISO,
  isValid as isValidDate,
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isAfter,
  format as formatDateFn,
} from 'date-fns';
import { getIntervalValue } from '../utils/date.utils';

interface Payment {
  date: Date;
  status: 'settled' | 'due' | 'upcoming';
  installmentAmount: number;
  principalForPeriod: number;
  interestForPeriod: number;
  cumulativePrincipalPaid: number;
  cumulativeInterestPaid: number;
  remainingPrincipal: number;
  totalPrincipalPaid?: number;
  totalInterestPaid?: number;
}

type DebtFilters = {
  duration?: string;
  q?: string;
  type?: 'given' | 'taken';
  isPaid?: 'true' | 'false';
};

export class DebtService {
  calculateInterest(
    amount: number,
    percentage: number,
    duration: any,
    type: 'simple' | 'compound',
    compoundingFrequency: number = 12,
    frequency?: number,
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
      const freqNum = Number(frequency);
      if (isNaN(freqNum) || freqNum <= 0) {
        throw new HTTPException(400, {
          message: 'Frequency number is required when duration is a unit (year, month, etc.).',
        });
      }
      switch (duration) {
        case 'year':
          timeDiffInYears = freqNum;
          break;
        case 'month':
          timeDiffInYears = freqNum / 12;
          break;
        case 'week':
          timeDiffInYears = (freqNum * 7) / 365.25;
          break;
        case 'day':
          timeDiffInYears = freqNum / 365.25;
          break;
        default:
          timeDiffInYears = 0;
      }
    } else if (typeof duration === 'number') {
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
      const n = compoundingFrequency;
      totalAmount = amountValue * Math.pow(1 + percentageValue / 100 / n, n * timeDiffInYears);
      interest = totalAmount - amountValue;
    }

    return {
      interest: parseFloat(interest.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }

  async getDebtAmortizationSchedule(debtId: string, userId: string): Promise<Payment[]> {
    const debtRecord = await db.query.Debts.findFirst({
      where: and(eq(Debts.id, debtId), or(eq(Debts.createdBy, userId), eq(Debts.userId, userId))),
    });

    if (!debtRecord) {
      throw new HTTPException(404, { message: 'Debt record not found or access denied.' });
    }

    const { amount, percentage, interestType, createdAt, dueDate, frequency, duration, isPaid } =
      debtRecord;

    if (!createdAt || !dueDate || !frequency || !duration) {
      throw new HTTPException(400, {
        message: 'Debt record is missing necessary details for schedule generation.',
      });
    }

    const startDate = new Date(createdAt);
    const endDate = new Date(dueDate);

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      throw new HTTPException(400, { message: 'Invalid date format in debt record.' });
    }

    const numInstallments = parseInt(frequency, 10);

    if (isNaN(numInstallments) || numInstallments <= 0) {
      throw new HTTPException(400, { message: 'Invalid frequency for schedule generation.' });
    }

    let schedule: Payment[] = [];
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;

    if (interestType === 'compound' && percentage > 0) {
      let remainingPrincipal = amount;
      let cumulativeInterest = 0;
      let cumulativePrincipal = 0;
      const periodicInterestRate = percentage / 100 / 12; // Assuming monthly installments for compound

      // Calculate fixed monthly payment for compound interest
      const installmentAmount =
        (amount * (periodicInterestRate * Math.pow(1 + periodicInterestRate, numInstallments))) /
        (Math.pow(1 + periodicInterestRate, numInstallments) - 1);

      if (isNaN(installmentAmount) || !isFinite(installmentAmount)) {
        // Fallback to simple interest if compound calculation results in invalid number
        schedule = this.generateSimpleInterestSchedule(debtRecord);
      } else {
        const today = new Date();
        for (let i = 1; i <= numInstallments; i++) {
          const interestForPeriod = remainingPrincipal * periodicInterestRate;
          let principalForPeriod = installmentAmount - interestForPeriod;

          // Adjust last payment to account for rounding
          if (i === numInstallments) {
            principalForPeriod = remainingPrincipal;
          }

          remainingPrincipal -= principalForPeriod;
          cumulativeInterest += interestForPeriod;
          cumulativePrincipal += principalForPeriod;

          const installmentDate = addMonths(startDate, i);
          const status: Payment['status'] = isPaid
            ? 'settled'
            : isAfter(today, installmentDate)
              ? 'due'
              : 'upcoming';

          schedule.push({
            date: installmentDate,
            status,
            installmentAmount: parseFloat(installmentAmount.toFixed(2)),
            principalForPeriod: parseFloat(principalForPeriod.toFixed(2)),
            interestForPeriod: parseFloat(interestForPeriod.toFixed(2)),
            cumulativePrincipalPaid: parseFloat(cumulativePrincipal.toFixed(2)),
            cumulativeInterestPaid: parseFloat(cumulativeInterest.toFixed(2)),
            remainingPrincipal: parseFloat(Math.max(0, remainingPrincipal).toFixed(2)),
          });
        }
      }
    } else {
      // Handles Simple interest
      schedule = this.generateSimpleInterestSchedule(debtRecord);
    }

    // Calculate total principal and interest paid from the generated schedule
    totalPrincipalPaid = schedule.reduce((sum, p) => sum + p.principalForPeriod, 0);
    totalInterestPaid = schedule.reduce((sum, p) => sum + p.interestForPeriod, 0);

    // Add total principal and interest paid to the last payment in the schedule
    if (schedule.length > 0) {
      schedule[schedule.length - 1].totalPrincipalPaid = parseFloat(totalPrincipalPaid.toFixed(2));
      schedule[schedule.length - 1].totalInterestPaid = parseFloat(totalInterestPaid.toFixed(2));
    }

    return schedule;
  }

  private generateSimpleInterestSchedule(debtRecord: InferInsertModel<typeof Debts>): Payment[] {
    const { amount, percentage, createdAt, dueDate, frequency, isPaid } = debtRecord;
    const totalInterestResult = this.calculateInterest(
      amount!,
      percentage!,
      `${formatDateFn(new Date(createdAt!), 'yyyy-MM-dd')},${formatDateFn(
        new Date(dueDate!),
        'yyyy-MM-dd',
      )}`,
      'simple',
    );

    const totalInterest = totalInterestResult.interest;
    const numInstallments = parseInt(frequency!, 10);

    if (isNaN(numInstallments) || numInstallments <= 0) return [];

    const interestPerInstallment = totalInterest > 0 ? totalInterest / numInstallments : 0;
    const principalPerInstallment = amount! / numInstallments;
    const installmentAmount = principalPerInstallment + interestPerInstallment;

    const schedule: Payment[] = [];
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    const today = new Date();
    const startDate = new Date(createdAt!);

    for (let i = 1; i <= numInstallments; i++) {
      let installmentDate: Date;
      const durationType = debtRecord.duration;
      switch (durationType) {
        case 'daily':
          installmentDate = addDays(startDate, i);
          break;
        case 'weekly':
          installmentDate = addWeeks(startDate, i);
          break;
        case 'yearly':
          installmentDate = addYears(startDate, i);
          break;
        case 'monthly':
        default:
          installmentDate = addMonths(startDate, i);
          break;
      }

      const status: Payment['status'] = isPaid
        ? 'settled'
        : isAfter(today, installmentDate)
          ? 'due'
          : 'upcoming';

      cumulativePrincipal += principalPerInstallment;
      cumulativeInterest += interestPerInstallment;

      schedule.push({
        date: installmentDate,
        status,
        installmentAmount: parseFloat(installmentAmount.toFixed(2)),
        principalForPeriod: parseFloat(principalPerInstallment.toFixed(2)),
        interestForPeriod: parseFloat(interestPerInstallment.toFixed(2)),
        cumulativePrincipalPaid: parseFloat(cumulativePrincipal.toFixed(2)),
        cumulativeInterestPaid: parseFloat(cumulativeInterest.toFixed(2)),
        remainingPrincipal: parseFloat(Math.max(0, amount! - cumulativePrincipal).toFixed(2)),
      });
    }

    // Calculate total principal and interest paid for simple interest
    const totalPrincipalPaid = schedule.reduce((sum, p) => sum + p.principalForPeriod, 0);
    const totalInterestPaid = schedule.reduce((sum, p) => sum + p.interestForPeriod, 0);

    // Add total principal and interest paid to the last payment in the schedule
    if (schedule.length > 0) {
      schedule[schedule.length - 1].totalPrincipalPaid = parseFloat(totalPrincipalPaid.toFixed(2));
      schedule[schedule.length - 1].totalInterestPaid = parseFloat(totalInterestPaid.toFixed(2));
    }

    return schedule;
  }

  // ... (rest of the service remains the same)
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

    const amountValue = Number(amount);
    const premiumAmountValue = Number(premiumAmount);
    const percentageValue = Number(percentage);

    if (isNaN(amountValue) || amountValue <= 0)
      throw new HTTPException(400, { message: 'Invalid amount.' });
    if (isNaN(premiumAmountValue) || premiumAmountValue < 0)
      throw new HTTPException(400, { message: 'Invalid premium amount.' });
    if (isNaN(percentageValue) || percentageValue < 0)
      throw new HTTPException(400, { message: 'Invalid percentage.' });

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
      durationValue = duration;
      frequencyValue = null;
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
      durationValue = duration;
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

    const involvedUserExists = await db.query.User.findFirst({
      where: eq(User.id, involvedUserId),
      columns: { id: true },
    });
    if (!involvedUserExists) throw new HTTPException(404, { message: 'Involved user not found.' });

    if (account) {
      const accountExists = await db.query.Account.findFirst({
        where: and(eq(Account.id, account), eq(Account.owner, ownerId)),
        columns: { id: true },
      });
      if (!accountExists)
        throw new HTTPException(404, {
          message: 'Associated account not found or does not belong to you.',
        });
    }

    const newDebt = await db
      .insert(Debts)
      .values({
        amount: amountValue,
        createdBy: ownerId,
        percentage: percentageValue,
        premiumAmount: premiumAmountValue,
        type,
        userId: involvedUserId,
        account: account ?? null,
        description,
        dueDate: calculatedDueDate?.toISOString().split('T')[0],
        duration: durationValue,
        frequency: frequencyValue,
        interestType,
        isPaid: false,
        createdAt: new Date(),
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

    let query: SQL<unknown> | undefined = or(eq(Debts.createdBy, userId), eq(Debts.userId, userId));

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

    if (filters.q && filters.q.trim().length > 0) {
      const searchNum = Number(filters.q);
      const amountFilter = !isNaN(searchNum)
        ? or(eq(Debts.amount, searchNum), eq(Debts.premiumAmount, searchNum))
        : undefined;
      query = and(
        query,
        or(
          ilike(Debts.description, `%${filters.q}%`),
          ilike(User.name, `%${filters.q}%`),
          ilike(Account.name, `%${filters.q}%`),
          amountFilter,
        ),
      );
    }

    if (filters.type && (filters.type === 'given' || filters.type === 'taken')) {
      query = and(query, eq(Debts.type, filters.type));
    }

    if (filters.isPaid) {
      query = and(query, eq(Debts.isPaid, filters.isPaid === 'true'));
    }

    const finalQuery = query;

    const totalCountResult = await db
      .select({ count: count() })
      .from(Debts)
      .leftJoin(User, eq(Debts.userId, User.id))
      .leftJoin(Account, eq(Debts.account, Account.id))
      .where(finalQuery)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });
    const totalCount = totalCountResult[0]?.count ?? 0;

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
      .leftJoin(User, eq(Debts.userId, User.id))
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
      columns: { createdBy: true, userId: true },
    });

    if (!existingDebt) {
      throw new HTTPException(404, { message: 'Debt record not found.' });
    }

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
      updateData.duration = duration;
    }
    if (frequency !== undefined) {
      if (!canModifyDetails)
        throw new HTTPException(403, { message: 'Permission denied to modify frequency.' });
      updateData.frequency = String(frequency);
    }
    if (isPaid !== undefined) {
      if (!canMarkPaid)
        throw new HTTPException(403, { message: 'Permission denied to mark this debt as paid.' });
      updateData.isPaid = Boolean(isPaid);
    }

    if (Object.keys(updateData).length === 1) {
      return { message: 'No changes provided.' };
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
    const existingDebt = await db.query.Debts.findFirst({
      where: and(eq(Debts.id, debtId), eq(Debts.createdBy, userId)),
      columns: { id: true },
    });

    if (!existingDebt) {
      throw new HTTPException(404, {
        message: 'Debt record not found or you do not have permission to delete it.',
      });
    }

    const deleted = await db.delete(Debts).where(eq(Debts.id, debtId)).returning({ id: Debts.id });

    if (deleted.length === 0) {
      throw new HTTPException(500, { message: 'Failed to delete debt record.' });
    }

    return { message: 'Debt deleted successfully' };
  }

  async markDebtAsPaid(debtId: string, userId: string) {
    const existingDebt = await db.query.Debts.findFirst({
      where: and(eq(Debts.id, debtId), or(eq(Debts.createdBy, userId), eq(Debts.userId, userId))),
      columns: { id: true },
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
