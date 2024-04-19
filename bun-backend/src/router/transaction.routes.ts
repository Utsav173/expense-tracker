import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { HTTPException } from 'hono/http-exception';
import { db } from '../database';
import {
  Account,
  Analytics,
  Category,
  Transaction,
  User,
} from '../database/schema';
import {
  InferInsertModel,
  SQL,
  and,
  count,
  desc,
  eq,
  gt,
  isNotNull,
  like,
  lt,
  min,
  or,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDateTruncate, getIntervalValue, increment } from '../utils';
import {
  durationValidation,
  transactionSchema,
} from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';
import handleAnalytics from '../utils/handleAnalytics';
import { z } from 'zod';
import { Chance } from 'chance';
import { utils, write } from 'xlsx';

const chance = new Chance();
const transactionRouter = new Hono();

transactionRouter.get('/', authMiddleware, async (c) => {
  const { accountId, duration, page = 1, pageSize = 10, q } = c.req.query();
  if (!accountId) {
    throw new HTTPException(400, { message: 'Account id is required' });
  }

  let query: SQL<unknown> | undefined = eq(Transaction.account, accountId);

  if (duration) {
    if (!durationValidation.safeParse(duration).success) {
      throw new HTTPException(400, {
        message: 'Start date and end date are required',
      });
    }

    // duration is one of from this 4 "today", "thisWeek", "thisMonth", "thisYear"
    const { endDate, startDate } = getIntervalValue(duration);

    query = and(
      query,
      and(
        gt(Transaction.createdAt, new Date(startDate as any)),
        lt(Transaction.createdAt, new Date(endDate as any))
      )
    );
  }

  if (q && q.length > 0) {
    query = and(
      query,
      or(
        like(Transaction.text, `%${q}%`),
        like(Transaction.transfer, `%${q}%`),
        eq(Transaction.amount, +q)
      )
    );
  }

  const totalCount = await db
    .select({ count: count(Transaction.id) })
    .from(Transaction)
    .where(query)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  const UpdatedBy = alias(User, 'UpdatedBy');

  const transactionData = await db
    .select({
      id: Transaction.id,
      amount: Transaction.amount,
      category: {
        id: Category.id,
        name: Category.name,
      },
      text: Transaction.text,
      isIncome: Transaction.isIncome,
      account: Transaction.account,
      transfer: Transaction.transfer,
      createdAt: Transaction.createdAt,
      createdBy: {
        id: User.id,
        name: User.name,
        email: User.email,
        profilePic: User.profilePic,
      },
      updatedBy: {
        id: UpdatedBy.id,
        name: UpdatedBy.name,
        email: UpdatedBy.email,
        profilePic: UpdatedBy.profilePic,
      },
      updatedAt: Transaction.updatedAt,
    })
    .from(Transaction)
    .leftJoin(Category, eq(Category.id, Transaction.category))
    .leftJoin(User, eq(User.id, Transaction.createdBy))
    .leftJoin(UpdatedBy, eq(UpdatedBy.id, Transaction.updatedBy))
    .where(query)
    .limit(+pageSize)
    .offset(+pageSize * (+page - 1))
    .orderBy(desc(Transaction.createdAt))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });
  return c.json({
    transactions: transactionData,
    totalCount: totalCount[0].count,
    totalPages: Math.ceil(totalCount[0].count / +pageSize),
    currentPage: +page,
    pageSize: +pageSize,
  });
});

transactionRouter.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();

  const UpdatedBy = alias(User, 'UpdatedBy');

  const transactionData = await db
    .select({
      id: Transaction.id,
      amount: Transaction.amount,
      category: {
        id: Category.id,
        name: Category.name,
      },
      text: Transaction.text,
      isIncome: Transaction.isIncome,
      account: Transaction.account,
      transfer: Transaction.transfer,
      createdAt: Transaction.createdAt,
      createdBy: {
        id: User.id,
        name: User.name,
        email: User.email,
        profilePic: User.profilePic,
      },
      updatedBy: {
        id: UpdatedBy.id,
        name: UpdatedBy.name,
        email: UpdatedBy.email,
        profilePic: UpdatedBy.profilePic,
      },
      updatedAt: Transaction.updatedAt,
    })
    .from(Transaction)
    .leftJoin(Category, eq(Category.id, Transaction.category))
    .leftJoin(User, eq(User.id, Transaction.createdBy))
    .leftJoin(UpdatedBy, eq(UpdatedBy.id, Transaction.updatedBy))
    .where(eq(Transaction.id, id))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json({ transaction: transactionData });
});

transactionRouter.get('/by/:field', authMiddleware, async (c) => {
  const { field } = c.req.param();
  const duration = c.req.query('duration');

  if (!durationValidation.safeParse(duration).success) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  const sortBy = c.req.query('sortBy')?.toLowerCase() || 'DESC';
  const { startDate, endDate } = getIntervalValue(duration);
  const userId = await c.get('userId' as any);

  if (!field || !startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Field, start date and end date are required',
    });
  }

  const validateField = z.enum(['amount', 'transfer', 'text', 'isIncome']);

  const validateSortBy = z.enum(['asc', 'desc', 'DESC', 'ASC']);

  if (!validateSortBy.safeParse(sortBy).success) {
    throw new HTTPException(400, {
      message: 'Invalid sort by, Supported sort by: asc, desc',
    });
  }

  if (!validateField.safeParse(field).success) {
    throw new HTTPException(400, {
      message:
        'Invalid field, Supported fields: amount, transfer, text, isIncome',
    });
  }

  const transactionData = await db
    .execute(
      sql.raw(`
      SELECT
        t.label,
        COUNT(*) AS count
          FROM (
            SELECT
            ${field} as label
          FROM transaction
            WHERE
              "createdAt" >= '${startDate}'
              AND "createdAt" <= '${endDate}'
              AND owner = '${userId}'
          ) AS t
          GROUP BY t.label
          ORDER BY count ${sortBy}`)
    )
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json(transactionData);
});

transactionRouter.get('/by/category/chart', authMiddleware, async (c) => {
  const duration = c.req.query('duration');

  if (!durationValidation.safeParse(duration).success) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  const { startDate, endDate } = getIntervalValue(duration);
  const userId = await c.get('userId' as any);
  if (!startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  const result = await db
    .execute(
      sql`
      WITH user_categories AS (
        SELECT
          id
        FROM
          category
        WHERE
          owner IS NULL OR owner = ${userId}
      )
      SELECT
        json_agg(name) AS "name",
        json_agg(totalIncome) AS "totalIncome",
        json_agg(totalExpense) AS "totalExpense"
      FROM (
        SELECT
          c.name,
          COALESCE(SUM(CASE WHEN t."isIncome" = true THEN t.amount ELSE 0 END), 0) AS totalIncome,
          COALESCE(SUM(CASE WHEN t."isIncome" = false THEN t.amount ELSE 0 END), 0) AS totalExpense
        FROM
          user_categories AS uc
        JOIN
          transaction AS t ON uc.id = t.category
        JOIN
          category AS c ON t.category = c.id
        WHERE
          t."createdAt" >= ${startDate}
          AND t."createdAt" <= ${endDate}
          AND t.owner = ${userId}
        GROUP BY
          c.name
      ) AS subquery;
      `
    )
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json(result[0] ?? { name: [], totalIncome: [], totalExpense: [] });
});

transactionRouter.get('/by/income/expense', authMiddleware, async (c) => {
  const accountId = c.req.query('accountId');
  const duration = c.req.query('duration');

  if (!durationValidation.safeParse(duration).success) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  const userId = await c.get('userId' as any);
  const { startDate, endDate } = getIntervalValue(duration);
  if (!startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  const result = await db
    .execute(
      sql.raw(`
        SELECT
          SUM(CASE WHEN t."isIncome" = TRUE THEN t.amount ELSE 0 END) AS income,
          SUM(CASE WHEN t."isIncome" = FALSE THEN t.amount ELSE 0 END) AS expense
        FROM "transaction" AS t
        WHERE
            t."createdAt" BETWEEN '${startDate}' AND '${endDate}'
        AND ${
          accountId ? `t.account = '${accountId}'` : `t.owner = '${userId}'`
        }`)
    )
    .then((res) => res[0])
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json(result);
});

transactionRouter.get('/by/income/expense/chart', authMiddleware, async (c) => {
  const accountId = c.req.query('accountId');
  const duration = c.req.query('duration');
  if (!durationValidation.safeParse(duration).success) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }
  const userId = await c.get('userId' as any);
  const { startDate, endDate } = getIntervalValue(duration);
  if (!startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  const result = await db
    .execute(
      sql.raw(`
      SELECT 
      json_agg(date) AS "date",
      json_agg(total_income) AS "income",
      json_agg(total_expense) AS "expense",
      json_agg(balance) AS "balance"
    FROM (
    SELECT
      ${getDateTruncate(duration)} AS date,
      SUM(CASE WHEN "isIncome" THEN amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN NOT "isIncome" THEN amount ELSE 0 END) AS total_expense,
      SUM(CASE WHEN "isIncome" THEN amount ELSE -amount END) AS balance
    FROM "transaction"
    WHERE "createdAt" BETWEEN '${startDate}' AND '${endDate}'
      AND ${accountId ? `account = '${accountId}'` : `owner = '${userId}'`}
    GROUP BY date
    ORDER BY date
    ) AS subquery
        `)
    )
    .then((result) => {
      return result[0];
    })
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json(result ?? { date: [], income: [], expense: [], balance: [] });
});

transactionRouter.get('/fakeData/by', async (c) => {
  const { duration, length } = c.req.query();

  if (!durationValidation.safeParse(duration).success) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }
  const { startDate, endDate } = getIntervalValue(duration);

  if (!startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  if (!length) {
    throw new HTTPException(400, { message: 'Length is required' });
  }

  const catIds = [
    'Groceries',
    'Utilities',
    'Rent/Mortgage',
    'Transportation',
    'Healthcare/Medical',
    'Entertainment',
    'Eating Out',
    'Clothing',
    'Education',
    'Gifts/Donations',
    'Travel',
    'Insurance',
    'Home Improvement',
    'Savings',
    'Other',
  ];

  let totalIncome = 0;
  let totalExpenses = 0;

  const exportedArray = [];
  for (let index = 0; index < Number(length); index++) {
    const randomIndex = Math.floor(Math.random() * catIds.length);
    const randomCategory = catIds[randomIndex];

    let randomAmount: number;
    let type;

    const rand = chance.floating({ min: 0, max: 1 });

    if (rand < 0.7) {
      // Generate expense
      randomAmount = chance.integer({ min: 1, max: 5000 });
      type = 'expense';
      totalExpenses += randomAmount;
    } else {
      // Generate income
      randomAmount = chance.integer({ min: 1, max: 10000 });
      type = 'income';
      totalIncome += randomAmount;
    }

    // Adjust expense amount to ensure overall balance is not negative
    if (totalExpenses > totalIncome) {
      if (type === 'expense') {
        const remainingIncome = totalIncome - totalExpenses;
        if (remainingIncome <= 0) {
          // If there's no remaining income, set expense to 0
          randomAmount = 0;
        } else {
          // Otherwise, adjust the expense to consume all remaining income
          randomAmount = Math.min(randomAmount, remainingIncome);
        }
      }
    }

    // Generate random date between startDate and endDate
    const startDateObj = new Date(startDate);
    const endDateObj = new Date();

    const randomDate = new Date(
      startDateObj.getTime() +
        Math.random() * (endDateObj.getTime() - startDateObj.getTime())
    );

    const temp = {
      Text: `Transaction ${chance.cc_type()} ${index} ${chance.word()}`,
      Amount: randomAmount,
      Type: type,
      Transfer: chance.name(),
      Category: randomCategory,
      Date: randomDate.toISOString(),
    };

    exportedArray.push(temp);
  }

  // Convert exportedArray json to excel file
  const ws = utils.json_to_sheet(exportedArray);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Transactions_data');
  const excelBuffer = write(wb, { type: 'buffer' });

  return c.newResponse(excelBuffer, 200, {
    'Content-Type':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename=Transactions_data.xlsx',
  });
});

transactionRouter.post(
  '/',
  zValidator('json', transactionSchema),
  authMiddleware,
  async (c) => {
    const { text, amount, isIncome, transfer, category, account } =
      await c.req.json();

    const userId = await c.get('userId' as any);

    const validAccount = await db
      .select({ id: Account.id, balance: Account.balance })
      .from(Account)
      .where(eq(Account.id, account))
      .catch((err) => {
        throw new HTTPException(500, { message: err.message });
      });

    if (!validAccount[0]) {
      throw new HTTPException(400, { message: 'Invalid account' });
    }

    if (validAccount[0].balance && +validAccount[0].balance < 0) {
      throw new HTTPException(400, { message: 'Insufficient balance' });
    }

    if (!isIncome && validAccount[0].balance! - amount < 0) {
      throw new HTTPException(400, { message: 'Insufficient balance' });
    }

    const helperData = {
      account: account,
      user: userId,
      isIncome: isIncome,
      amount: amount,
    };

    await db
      .insert(Transaction)
      .values({
        text: text,
        amount: amount,
        isIncome: isIncome,
        transfer: transfer,
        category: category,
        account: account,
        owner: userId,
      })
      .returning()
      .then(async (data) => {
        await handleAnalytics(helperData);
      })
      .catch((err) => {
        throw new HTTPException(500, { message: err.message });
      });

    return c.json({
      message: 'Transaction created successfully',
    });
  }
);

transactionRouter.put('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const { text, amount, isIncome, transfer, category, createdAt } =
    await c.req.json();

  const userId = await c.get('userId' as any);

  let transactionData: InferInsertModel<typeof Transaction> = {
    text,
    amount,
    isIncome,
    transfer,
    category,
    updatedBy: userId,
  };

  if (createdAt) {
    transactionData['createdAt'] = createdAt;
  }
  const validTransaction = await db.query.Transaction.findFirst({
    where: eq(Transaction.id, id),
  });

  if (!validTransaction) {
    throw new HTTPException(400, { message: 'Transaction not found' });
  }

  const validBalance = await db.query.Account.findFirst({
    where: eq(Account.id, validTransaction.account as string),
  });

  const amountDifference = transactionData.amount - validTransaction.amount;
  const typeChanged = validTransaction.isIncome !== transactionData.isIncome;
  const amountChanged = amountDifference !== 0;

  let typeChange = 0;
  let amountChange = 0;

  if (typeChanged) {
    typeChange = transactionData.isIncome
      ? transactionData.amount
      : -transactionData.amount;
  } else if (amountChanged) {
    amountChange = transactionData.isIncome
      ? amountDifference
      : -amountDifference;
  }

  const totalChange = typeChange + amountChange;
  const updatedBalance = validBalance?.balance! + totalChange;

  if (totalChange !== 0 && updatedBalance < 0) {
    throw new HTTPException(400, { message: 'Insufficient balance' });
  }

  let updateOperation: any = {};

  if (typeChange !== 0) {
    const typeChangeField = transactionData.isIncome ? 'income' : 'expense';
    const typeChangeValue = Math.max(Math.abs(typeChange), 0);
    updateOperation = {
      ...updateOperation,
      [typeChangeField]: increment(Analytics[typeChangeField], typeChangeValue),
      balance: increment(Analytics.balance, typeChange),
    };
  }

  if (amountChange !== 0) {
    const amountChangeField = transactionData.isIncome ? 'income' : 'expense';
    const amountChangeValue = Math.max(Math.abs(amountChange), 0);
    updateOperation = {
      ...updateOperation,
      [amountChangeField]: increment(
        Analytics[amountChangeField],
        amountChangeValue
      ),
      balance: increment(Analytics.balance, amountChange),
    };
  }

  await db
    .transaction(async (tx) => {
      if (Object.keys(updateOperation).length > 0) {
        await tx
          .update(Analytics)
          .set(updateOperation)
          .where(eq(Analytics.account, validTransaction.account as string))
          .catch((err) => {
            throw new HTTPException(500, { message: err.message });
          });

        await tx
          .update(Account)
          .set({ balance: increment(Analytics.balance, totalChange) })
          .where(eq(Account.id, validTransaction.account as string))
          .catch((err) => {
            throw new HTTPException(500, { message: err.message });
          });
      }

      await tx
        .update(Transaction)
        .set(transactionData)
        .where(eq(Transaction.id, id))
        .catch((err) => {
          throw new HTTPException(500, { message: err.message });
        });

      return c.json({
        message: 'Transaction updated successfully',
      });
    })
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });
});

transactionRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();

    const userId = await c.get('userId' as any);

    const validTransaction = await db.query.Transaction.findFirst({
      where: eq(Transaction.id, id),
      columns: {
        account: true,
        amount: true,
        isIncome: true,
        createdBy: true,
      },
    });

    if (!validTransaction) {
      throw new HTTPException(400, { message: 'Transaction not found' });
    }

    if (userId !== validTransaction.createdBy) {
      throw new HTTPException(400, {
        message: 'You are not authorized to delete this transaction',
      });
    }

    const accountData = await db.query.Account.findFirst({
      where: eq(Account.id, validTransaction.account as string),
      columns: {
        balance: true,
      },
    });

    const analyticsData = await db.query.Analytics.findFirst({
      where: eq(Analytics.account, validTransaction.account as string),
      columns: {
        income: true,
        expense: true,
        balance: true,
      },
    });

    const updatedAccountBalance =
      accountData?.balance! - validTransaction.amount;

    if (validTransaction.isIncome && updatedAccountBalance < 0) {
      throw new HTTPException(400, { message: 'Insufficient balance' });
    }

    await db
      .update(Account)
      .set({ balance: updatedAccountBalance })
      .where(eq(Account.id, validTransaction.account as string));

    if (validTransaction.isIncome) {
      const updatedIncome = analyticsData?.income! - validTransaction.amount;
      const updatedBalance = analyticsData?.balance! - validTransaction.amount;
      await db
        .update(Analytics)
        .set({ income: updatedIncome, balance: updatedBalance })
        .where(eq(Analytics.account, validTransaction.account as string));
    } else {
      const updatedExpenses = analyticsData?.expense! - validTransaction.amount;
      const updatedBalance = analyticsData?.balance! + validTransaction.amount;
      await db
        .update(Analytics)
        .set({ expense: updatedExpenses, balance: updatedBalance })
        .where(eq(Analytics.account, validTransaction.account as string));
    }

    await db.delete(Transaction).where(eq(Transaction.id, id));
    return c.json({
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : 'Something went wrong',
    });
  }
});

export default transactionRouter;
