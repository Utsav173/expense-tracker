import { Hono } from 'hono';
import { debtSchema, interestSchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';
import authMiddleware from '../middleware';
import { HTTPException } from 'hono/http-exception';
import { differenceInDays, differenceInMonths } from 'date-fns';
import { InferInsertModel, SQL, and, asc, count, desc, eq, gt, like, lt, or } from 'drizzle-orm';
import { Account, Debts, User } from '../database/schema';
import { getIntervalValue } from '../utils';
import { db } from '../database';

const interestRouter = new Hono();

// POST /interest - Create an interest
interestRouter.post('/create', zValidator('json', interestSchema), authMiddleware, async (c) => {
  const { amount, percentage, type, duration, compoundingFrequency } = await c.req.json();
  const amountValue = Number(amount);
  const percentageValue = Number(percentage);
  const compoundingFrequencyValue = Number(compoundingFrequency);

  if (
    isNaN(amountValue) ||
    isNaN(percentageValue) ||
    (type === 'compound' && isNaN(compoundingFrequencyValue))
  ) {
    throw new HTTPException(400, {
      message: 'Invalid amount, percentage, or compounding frequency',
    });
  }

  const today = new Date();
  let endDate: Date; // Declare endDate as a Date

  if (duration && duration.includes(',')) {
    const [startDateString, endDateString] = duration.split(',');
    const startDate = new Date(startDateString);
    endDate = new Date(endDateString);

    // Validate if startDate is before endDate
    if (startDate >= endDate) {
      throw new HTTPException(400, {
        message: 'Start date must be before end date',
      });
    }
  } else {
    switch (duration) {
      case 'year':
        endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        break;
      case 'month':
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        break;
      case 'week':
        endDate = new Date(
          differenceInDays(today, new Date(today.setDate(today.getDate() - today.getDay()))),
        );
        break;
      case 'day':
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        break;
      default:
        throw new HTTPException(400, { message: 'Invalid duration' });
    }
  }

  let days = differenceInDays(endDate, today) + 1;

  let totalAmount, interest;

  switch (type) {
    case 'simple':
      totalAmount = amountValue * (1 + (percentageValue / 100) * (days / 365));
      interest = totalAmount - amountValue;
      break;
    case 'compound':
      let n = compoundingFrequencyValue || 365;

      switch (duration) {
        case 'year':
          days = 1;
          break;
        case 'month':
          days = 12;
          break;
        case 'week':
          days = 52;
          break;
        case 'day':
          days = 365;
          break;
        default:
          n = days / 365;
          days = 365;
      }

      totalAmount = amountValue * Math.pow(1 + percentageValue / (days * 100), n * days);
      interest = totalAmount - amountValue;
      break;
    default:
      throw new HTTPException(400, { message: 'Invalid interest type' });
  }

  // Rounding to two decimal places
  totalAmount = +totalAmount.toFixed(2);
  interest = +interest.toFixed(2);

  return c.json({ interest, totalAmount });
});

// POST /Debts - Create a new Debts
interestRouter.post('/debts', zValidator('json', debtSchema), authMiddleware, async (c) => {
  const {
    amount,
    premiumAmount,
    description,
    duration,
    percentage,
    frequency,
    user,
    type,
    interestType,
    account,
  } = await c.req.json();
  const ownerId = await c.get('userId' as any);
  const userId = user;

  let dueDate = new Date();
  const amountValue = Number(amount);
  const premiumAmountValue = Number(premiumAmount);
  const percentageValue = Number(percentage);

  if (isNaN(amountValue) || isNaN(premiumAmountValue) || isNaN(percentageValue)) {
    throw new HTTPException(400, {
      message: 'Invalid amount, premium amount or percentage',
    });
  }

  if (duration.split(',').length > 1) {
    // by month only
    const [startDateString, endDateString] = duration.split(',');
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new HTTPException(400, { message: 'Invalid date format' });
    }

    const monthsDiff = differenceInMonths(endDate, startDate);
    dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + monthsDiff);
  } else {
    switch (duration) {
      case 'year':
        dueDate.setFullYear(dueDate.getFullYear() + 1 * Number(frequency));
        break;
      case 'month':
        dueDate.setMonth(dueDate.getMonth() + 1 * Number(frequency));
        break;
      case 'week':
        dueDate.setDate(dueDate.getDate() + 7 * Number(frequency));
        break;
      case 'day':
        dueDate.setDate(dueDate.getDate() + Number(frequency));
        break;
      default:
        break;
    }
  }

  const newDebt = await db
    .insert(Debts)
    .values({
      amount,
      createdBy: ownerId,
      percentage,
      premiumAmount,
      type,
      userId,
      account,
      description,
      dueDate: new Date(dueDate).toISOString(),
      duration,
      frequency,
      interestType,
    })
    .returning();

  return c.json({ message: 'Debts created successfully', data: newDebt[0] });
});

// GET /debts - Get debts for a user
interestRouter.get('/debts', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);
  const { duration, page = 1, pageSize = 10, q, type, sortOrder = 'desc' } = c.req.query();

  const sortBy: keyof InferInsertModel<typeof Debts> =
    (c.req.query('sortBy') as any) || 'createdAt';

  let query: SQL<unknown> | undefined = eq(Debts.createdBy, userId);

  if (duration && duration.trim().length > 0) {
    // duration is one of from this 4 "today", "thisWeek", "thisMonth", "thisYear"
    const { endDate, startDate } = await getIntervalValue(duration);

    // check if start date and end date are provided
    query = and(
      query,
      and(
        gt(Debts.createdAt, new Date(startDate as any)),
        lt(Debts.createdAt, new Date(endDate as any)),
      ),
    );
  }

  if (q && q.trim().length > 0) {
    query = and(
      query,
      or(like(Debts.description, `%${q}%`), like(Debts.dueDate, `%${q}%`), eq(Debts.amount, +q)),
    );
  }

  if (type) {
    query = and(query, eq(Debts.type as any, type));
  }

  // get total count
  const totalCount = await db
    .select({ count: count(Debts.id) })
    .from(Debts)
    .where(query)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  const debts = await db
    .select()
    .from(Debts)
    .leftJoin(Account, eq(Debts.account, Account.id))
    .leftJoin(User, eq(Debts.createdBy, User.id))
    .where(query)
    .limit(+pageSize)
    .offset(+pageSize * (+page - 1))
    .orderBy(sortOrder === 'asc' ? asc(Debts[sortBy]) : desc(Debts[sortBy]))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json({
    data: debts,
    totalCount: totalCount[0].count,
    totalPages: Math.ceil(totalCount[0].count / +pageSize),
    currentPage: +page,
    pageSize: +pageSize,
  });
});

// PUT /Debts/:id - Update a Debts
interestRouter.put('/debts/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const { description, isPaid, duration, frequency } = await c.req.json();
  const userId = await c.get('userId' as any);

  await db
    .update(Debts)
    .set({ description, isPaid, duration, frequency })
    .where(and(eq(Debts.id, id), eq(Debts.createdBy, userId)));

  return c.json({ message: 'Debts updated successfully' });
});

// DELETE /Debts/:id - Delete a Debts
interestRouter.delete('/debts/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = await c.get('userId' as any);

  await db.delete(Debts).where(and(eq(Debts.id, id), eq(Debts.createdBy, userId)));

  return c.json({ message: 'Debts deleted successfully' });
});

// PUT /debts/:id/mark-paid - Mark a debt as paid
interestRouter.put('/debts/:id/mark-paid', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = await c.get('userId' as any);

  await db
    .update(Debts)
    .set({ isPaid: true })
    .where(and(eq(Debts.id, id), eq(Debts.createdBy, userId)));

  return c.json({ message: 'Debt marked as paid' });
});

export default interestRouter;
