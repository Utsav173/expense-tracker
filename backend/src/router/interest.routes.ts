import { Hono } from 'hono';
import { debtSchema, interestSchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';
import authMiddleware from '../middleware';
import { HTTPException } from 'hono/http-exception';
import { differenceInDays } from 'date-fns';
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
import { Account, Debts, User } from '../database/schema';
import { getIntervalValue } from '../utils';
import { db } from '../database';

const interestRouter = new Hono();

interestRouter.post('/create', zValidator('json', interestSchema), authMiddleware, async (c) => {
  const { amount, percentage, type, duration, compoundingFrequency } = await c.req.json();
  const amountValue = Number(amount);
  const percentageValue = Number(percentage);
  const compoundingFrequencyValue = Number(compoundingFrequency);

  if (
    isNaN(amountValue) ||
    isNaN(percentageValue) ||
    (type === 'compound' && !duration.includes(',') && isNaN(compoundingFrequencyValue))
  ) {
    throw new HTTPException(400, {
      message: 'Invalid amount, percentage, or missing compounding frequency for compound interest',
    });
  }

  const today = new Date();
  let startDateForDiff = today;
  let endDate: Date;
  let timeDiffInYears: number;

  if (duration && duration.includes(',')) {
    const [startDateString, endDateString] = duration.split(',');
    const startDate = new Date(startDateString);
    endDate = new Date(endDateString);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      throw new HTTPException(400, {
        message: 'Invalid date range. Start date must be before end date.',
      });
    }
    startDateForDiff = startDate;
    timeDiffInYears = differenceInDays(endDate, startDate) / 365.25;
  } else {
    let numUnits = 1;
    switch (duration) {
      case 'year':
        endDate = new Date(today.getFullYear() + numUnits, today.getMonth(), today.getDate());
        timeDiffInYears = numUnits;
        break;
      case 'month':
        endDate = new Date(today.getFullYear(), today.getMonth() + numUnits, today.getDate());
        timeDiffInYears = numUnits / 12;
        break;
      case 'week':
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7 * numUnits);
        timeDiffInYears = (7 * numUnits) / 365.25;
        break;
      case 'day':
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + numUnits);
        timeDiffInYears = numUnits / 365.25;
        break;
      default:
        throw new HTTPException(400, { message: 'Invalid duration unit' });
    }
  }

  let totalAmount, interest;

  switch (type) {
    case 'simple':
      interest = amountValue * (percentageValue / 100) * timeDiffInYears;
      totalAmount = amountValue + interest;
      break;
    case 'compound':
      const n = compoundingFrequencyValue || 1;
      totalAmount = amountValue * Math.pow(1 + percentageValue / 100 / n, n * timeDiffInYears);
      interest = totalAmount - amountValue;
      break;
    default:
      throw new HTTPException(400, { message: 'Invalid interest type' });
  }

  totalAmount = +totalAmount.toFixed(2);
  interest = +interest.toFixed(2);

  return c.json({ interest, totalAmount });
});

interestRouter.post('/debts', zValidator('json', debtSchema), authMiddleware, async (c) => {
  try {
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
    } = await c.req.json();
    const ownerId = await c.get('userId' as any);

    const amountValue = Number(amount);
    const premiumAmountValue = Number(premiumAmount);
    const percentageValue = Number(percentage);

    if (isNaN(amountValue) || amountValue <= 0) {
      throw new HTTPException(400, { message: 'Invalid amount. Must be a positive number.' });
    }
    if (isNaN(premiumAmountValue) || premiumAmountValue < 0) {
      throw new HTTPException(400, { message: 'Invalid premium amount. Must be non-negative.' });
    }
    if (isNaN(percentageValue) || percentageValue < 0) {
      throw new HTTPException(400, { message: 'Invalid percentage. Must be non-negative.' });
    }

    let calculatedDueDate: Date | null = null;
    let durationValue: string | null = null;
    let frequencyValue: string | null = null;

    if (duration && typeof duration === 'string' && duration.includes(',')) {
      const [startDateString, endDateString] = duration.split(',');
      const startDate = new Date(startDateString);
      const endDate = new Date(endDateString);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
        throw new HTTPException(400, {
          message: 'Invalid date range format or start date is not before end date',
        });
      }
      calculatedDueDate = endDate;
      durationValue = duration;
      frequencyValue = null;
    } else if (duration && ['year', 'month', 'week', 'day'].includes(duration)) {
      const freqNum = Number(frequency);
      if (isNaN(freqNum) || freqNum <= 0) {
        throw new HTTPException(400, {
          message:
            'Frequency (number of units) is required and must be positive for duration units.',
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
      throw new HTTPException(400, {
        message:
          'Invalid duration format. Use "year", "month", "week", "day", or "YYYY-MM-DD,YYYY-MM-DD".',
      });
    }

    const involvedUserExists = await db.query.User.findFirst({
      where: eq(User.id, involvedUserId),
      columns: { id: true },
    });
    if (!involvedUserExists) {
      throw new HTTPException(404, { message: 'Involved user not found.' });
    }

    const accountExists = await db.query.Account.findFirst({
      where: and(eq(Account.id, account), eq(Account.owner, ownerId)),
      columns: { id: true },
    });
    if (!accountExists) {
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
        account,
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

    return c.json({ message: 'Debt created successfully', data: newDebt[0] });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Debt creation endpoint error:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});

interestRouter.get('/debts', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);
    const { duration, page = 1, pageSize = 10, q, type, sortOrder = 'desc' } = c.req.query();

    const sortByRaw = c.req.query('sortBy') || 'createdAt';

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

    const sortColumn = sortColumnMap[sortByRaw] || Debts.createdAt;

    if (!sortColumn) {
      throw new HTTPException(400, { message: `Invalid sort field: ${sortByRaw}` });
    }

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? asc : desc;
    const orderByClause = sortDirection(sortColumn as AnyColumn | SQL);

    let query: SQL<unknown> | undefined = eq(Debts.createdBy, userId);

    if (duration && duration.trim().length > 0) {
      try {
        const { endDate, startDate } = await getIntervalValue(duration);
        query = and(
          query,
          and(
            gt(Debts.createdAt, new Date(startDate as any)),
            lt(Debts.createdAt, new Date(endDate as any)),
          ),
        );
      } catch (e) {
        throw new HTTPException(400, { message: 'Invalid duration format.' });
      }
    }

    if (q && q.trim().length > 0) {
      const searchNum = Number(q);
      const amountFilter = !isNaN(searchNum) ? eq(Debts.amount, searchNum) : undefined;
      query = and(
        query,
        or(
          ilike(Debts.description, `%${q}%`),
          ilike(Debts.dueDate, `%${q}%`),
          ilike(User.name, `%${q}%`),
          amountFilter,
        ),
      );
    }

    if (type && (type === 'given' || type === 'taken')) {
      query = and(query, eq(Debts.type, type));
    }

    const finalQuery = query;

    const totalCountResult = await db
      .select({ count: count(Debts.id) })
      .from(Debts)
      .leftJoin(User, eq(Debts.userId, User.id))
      .where(finalQuery)
      .catch((err) => {
        console.error('Error counting debts:', err);
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
      .limit(+pageSize)
      .offset(+pageSize * (+page - 1))
      .orderBy(orderByClause)
      .catch((err) => {
        console.error('Error fetching debts:', err);
        throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
      });

    return c.json({
      data: debts,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / +pageSize),
      currentPage: +page,
      pageSize: +pageSize,
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error in GET /debts:', err);
    throw new HTTPException(500, { message: 'An unexpected error occurred.' });
  }
});

interestRouter.put('/debts/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const { description, isPaid, duration, frequency } = await c.req.json();
    const userId = await c.get('userId' as any);

    const updateData: Partial<InferInsertModel<typeof Debts>> = { updatedAt: new Date() };
    if (description !== undefined) updateData.description = description;
    if (isPaid !== undefined) updateData.isPaid = Boolean(isPaid);
    if (duration !== undefined) updateData.duration = duration;
    if (frequency !== undefined) updateData.frequency = String(frequency);

    const existingDebt = await db.query.Debts.findFirst({
      where: eq(Debts.id, id),
      columns: { createdBy: true },
    });

    if (!existingDebt) {
      throw new HTTPException(404, { message: 'Debt record not found.' });
    }

    if (existingDebt.createdBy !== userId) {
      throw new HTTPException(403, { message: 'You do not have permission to update this debt.' });
    }

    const updated = await db
      .update(Debts)
      .set(updateData)
      .where(eq(Debts.id, id))
      .returning({ id: Debts.id });

    if (updated.length === 0) {
      throw new HTTPException(500, { message: 'Failed to update debt record.' });
    }

    return c.json({ message: 'Debt updated successfully' });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error updating debt:', err);
    throw new HTTPException(500, { message: 'An unexpected error occurred during update.' });
  }
});

interestRouter.delete('/debts/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = await c.get('userId' as any);

    const existingDebt = await db.query.Debts.findFirst({
      where: eq(Debts.id, id),
      columns: { createdBy: true },
    });

    if (!existingDebt) {
      throw new HTTPException(404, { message: 'Debt record not found.' });
    }

    if (existingDebt.createdBy !== userId) {
      throw new HTTPException(403, { message: 'You do not have permission to delete this debt.' });
    }

    const deleted = await db.delete(Debts).where(eq(Debts.id, id)).returning({ id: Debts.id });

    if (deleted.length === 0) {
      throw new HTTPException(500, { message: 'Failed to delete debt record.' });
    }

    return c.json({ message: 'Debt deleted successfully' });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error deleting debt:', err);
    throw new HTTPException(500, { message: 'An unexpected error occurred during deletion.' });
  }
});

interestRouter.put('/debts/:id/mark-paid', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = await c.get('userId' as any);

    const existingDebt = await db.query.Debts.findFirst({
      where: eq(Debts.id, id),
      columns: { createdBy: true },
    });

    if (!existingDebt) {
      throw new HTTPException(404, { message: 'Debt record not found.' });
    }

    if (existingDebt.createdBy !== userId) {
      throw new HTTPException(403, { message: 'You do not have permission to update this debt.' });
    }

    const updated = await db
      .update(Debts)
      .set({ isPaid: true, updatedAt: new Date() })
      .where(eq(Debts.id, id))
      .returning({ id: Debts.id });

    if (updated.length === 0) {
      throw new HTTPException(500, { message: 'Failed to mark debt as paid.' });
    }

    return c.json({ message: 'Debt marked as paid' });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error marking debt as paid:', err);
    throw new HTTPException(500, { message: 'An unexpected error occurred.' });
  }
});

export default interestRouter;
