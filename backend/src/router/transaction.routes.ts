import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { HTTPException } from 'hono/http-exception';
import { db } from '../database';
import { Account, Analytics, Category, Transaction, User } from '../database/schema';
import { InferInsertModel, SQL, and, count, desc, eq, gt, like, lt, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDateTruncate, getIntervalValue, increment } from '../utils';
import { transactionSchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';
import handleAnalytics from '../utils/handleAnalytics';
import { z } from 'zod';
import { Chance } from 'chance';
import { utils, write } from 'xlsx';

const chance = new Chance();

// create a new Hono instance for the transaction router
const transactionRouter = new Hono();

// GET / - Get a list of transactions
transactionRouter.get('/', authMiddleware, async (c) => {
  // get query params
  const { accountId, duration, page = 1, pageSize = 10, q } = c.req.query();
  let query: SQL<unknown> | undefined;
  // // validate query params
  if (!accountId) {
    const userId = await c.get('userId' as any);

    query = eq(Transaction.owner, userId);
  } else {
    query = eq(Transaction.account, accountId);
  }

  // constructed serach condition

  // check if duration is provided
  if (duration && duration.trim().length > 0) {
    // duration is one of from this 4 "today", "thisWeek", "thisMonth", "thisYear"
    const { endDate, startDate } = await getIntervalValue(duration);

    // check if start date and end date are provided
    query = and(
      query,
      and(
        gt(Transaction.createdAt, new Date(startDate as any)),
        lt(Transaction.createdAt, new Date(endDate as any)),
      ),
    );
  }

  // check if q is provided and length is greater than 0
  if (q && q.length > 0) {
    query = and(
      query,
      or(
        like(Transaction.text, `%${q}%`),
        like(Transaction.transfer, `%${q}%`),
        eq(Transaction.amount, +q),
      ),
    );
  }

  // get total count
  const totalCount = await db
    .select({ count: count(Transaction.id) })
    .from(Transaction)
    .where(query)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  const UpdatedBy = alias(User, 'UpdatedBy');

  // get transactions data
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
      recurring: Transaction.recurring,
      recurrenceType: Transaction.recurrenceType,
      recurrenceEndDate: Transaction.recurrenceEndDate,
      currency: Transaction.currency,
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

  // return response
  return c.json({
    transactions: transactionData,
    totalCount: totalCount[0].count,
    totalPages: Math.ceil(totalCount[0].count / +pageSize),
    currentPage: +page,
    pageSize: +pageSize,
  });
});

// GET /:id - Get a transaction
transactionRouter.get('/:id', authMiddleware, async (c) => {
  // get query params
  const { id } = c.req.param();

  // validate query params
  if (!id) {
    throw new HTTPException(400, { message: 'Transaction id is required' });
  }

  const UpdatedBy = alias(User, 'UpdatedBy');

  // get transactions data
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
      recurring: Transaction.recurring,
      recurrenceType: Transaction.recurrenceType,
      recurrenceEndDate: Transaction.recurrenceEndDate,
      currency: Transaction.currency,
    })
    .from(Transaction)
    .leftJoin(Category, eq(Category.id, Transaction.category))
    .leftJoin(User, eq(User.id, Transaction.createdBy))
    .leftJoin(UpdatedBy, eq(UpdatedBy.id, Transaction.updatedBy))
    .where(eq(Transaction.id, id))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  // return response
  return c.json({ transaction: transactionData });
});

// GET /by/:field - Get transactions by field
transactionRouter.get('/by/:field', authMiddleware, async (c) => {
  // get query params
  const { field } = c.req.param();
  const duration = c.req.query('duration');

  const sortBy = c.req.query('sortBy')?.toLowerCase() || 'DESC';
  const { startDate, endDate } = await getIntervalValue(duration);
  const userId = await c.get('userId' as any);

  // validate query params
  if (!field || !startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Field, start date and end date are required',
    });
  }

  // validate field
  const validateField = z.enum(['amount', 'transfer', 'text', 'isIncome']);

  // validate sort by
  const validateSortBy = z.enum(['asc', 'desc', 'DESC', 'ASC']);

  // validate query params
  if (!validateSortBy.safeParse(sortBy).success) {
    throw new HTTPException(400, {
      message: 'Invalid sort by, Supported sort by: asc, desc',
    });
  }

  // validate query params
  if (!validateField.safeParse(field).success) {
    throw new HTTPException(400, {
      message: 'Invalid field, Supported fields: amount, transfer, text, isIncome',
    });
  }

  /* The below code is executing a database query to retrieve transaction data based on
    certain criteria. It is selecting the label and counting the occurrences of each label within a
    specified date range and for a specific user. The query groups the results by label and orders
    them based on the count in either ascending or descending order, depending on the value of the
    `sortBy` variable. If there is an error during the database query execution, it will throw an
    HTTPException with a status code of 500 and an error message. */
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
          ORDER BY count ${sortBy}`),
    )
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json(transactionData);
});

// GET /by/category/chart - Get transactions by category
transactionRouter.get('/by/category/chart', authMiddleware, async (c) => {
  // get query params
  const duration = c.req.query('duration');
  const { startDate, endDate } = await getIntervalValue(duration);
  const userId = await c.get('userId' as any);

  // validate query params
  if (!startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  /* The below code is a SQL query that retrieves aggregated data on income and expenses
    for categories associated with a specific user within a given time range. Here is a breakdown
    of the code: */
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
      `,
    )
    .then((res) => res.rows)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  // return result
  return c.json(result[0] ?? { name: [], totalIncome: [], totalExpense: [] });
});

// GET /by/income/expense - Get transactions by income and expense
transactionRouter.get('/by/income/expense', authMiddleware, async (c) => {
  // get query params
  const accountId = c.req.query('accountId');
  const duration = c.req.query('duration');
  const userId = await c.get('userId' as any);

  // extract start date and end date from duration
  const { startDate, endDate } = await getIntervalValue(duration);
  if (!startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  /* The below code is executing a SQL query to retrieve the sum of income and expenses from
    the "transaction" table based on certain conditions. It uses conditional aggregation with CASE
    statements to calculate the sum of amounts for income and expenses separately. The query filters
    transactions based on the "createdAt" field falling between the specified startDate and endDate.
    Additionally, it includes a condition to filter transactions based on either the account ID or user
    ID depending on the presence of the accountId variable. The result of the query is then returned as
    an object with the income and expense values. If an error occurs during the execution of the */
  const result = await db
    .execute(
      sql.raw(`
        SELECT
          SUM(CASE WHEN t."isIncome" = TRUE THEN t.amount ELSE 0 END) AS income,
          SUM(CASE WHEN t."isIncome" = FALSE THEN t.amount ELSE 0 END) AS expense
        FROM "transaction" AS t
        WHERE
            t."createdAt" BETWEEN '${startDate}' AND '${endDate}'
        AND ${accountId ? `t.account = '${accountId}'` : `t.owner = '${userId}'`}`),
    )
    .then((res) => res.rows[0])
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  // return result
  return c.json(result);
});

// GET /by/income/expense/chart - Get transactions by income and expense
transactionRouter.get('/by/income/expense/chart', authMiddleware, async (c) => {
  // get query params
  const accountId = c.req.query('accountId');
  const duration = c.req.query('duration');
  const userId = await c.get('userId' as any);

  // extract start date and end date from duration
  const { startDate, endDate } = await getIntervalValue(duration);
  if (!startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  // This query generates aggregated income, expense and balance data
  // for a given duration, accountId or userId
  // The subquery generates daily aggregated data using window functions
  // and the outer query aggregates the daily data to generate the final result
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
    ) AS subquery`),
    )
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  // return result
  return c.json(result ?? { date: [], income: [], expense: [], balance: [] });
});

// GET /fakeData/by - Get fake data
transactionRouter.get('/fakeData/by', async (c) => {
  // get query params
  const { duration, length } = c.req.query();

  // extract start date and end date from duration
  const { startDate, endDate } = await getIntervalValue(duration);
  if (!startDate || !endDate) {
    throw new HTTPException(400, {
      message: 'Start date and end date are required',
    });
  }

  // validate query params
  if (!length) {
    throw new HTTPException(400, { message: 'Length is required' });
  }

  // generate fake data
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

    // Generate random date between startDate and endDate
    const randomDate = new Date(
      startDateObj.getTime() + Math.random() * (endDateObj.getTime() - startDateObj.getTime()),
    );

    // Add data to exportedArray
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

  // Return excel file
  return c.newResponse(excelBuffer, 200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename=Transactions_data.xlsx',
  });
});

// POST / - Create a new transaction
transactionRouter.post('/', zValidator('json', transactionSchema), authMiddleware, async (c) => {
  // get body params
  const {
    text,
    amount,
    isIncome,
    transfer,
    category,
    account,
    recurring,
    recurrenceType,
    recurrenceEndDate,
    currency,
  } = await c.req.json();

  // get userId from token
  const userId = await c.get('userId' as any);

  // validate account
  const validAccount = await db
    .select({ id: Account.id, balance: Account.balance, currency: Account.currency })
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

  // create helperData
  const helperData = {
    account: account,
    user: userId,
    isIncome: isIncome,
    amount: amount,
  };

  // create transaction
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
      createdBy: userId,
      updatedBy: userId,
      recurring: recurring,
      recurrenceType: recurring ? recurrenceType : null,
      recurrenceEndDate: recurring ? new Date(recurrenceEndDate) : null,
      currency: currency ?? validAccount[0].currency,
    })
    .returning()
    .then(async (data) => {
      await handleAnalytics(helperData);
    })
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  // return response
  return c.json({
    message: 'Transaction created successfully',
  });
});

// PUT /:id - Update a transaction
transactionRouter.put('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  // get body params
  const {
    text,
    amount,
    isIncome,
    transfer,
    category,
    createdAt,
    recurring,
    recurrenceType,
    recurrenceEndDate,
    currency,
  } = await c.req.json();

  // get userId from token
  const userId = await c.get('userId' as any);

  // prepare transaction data
  let transactionData: InferInsertModel<typeof Transaction> = {
    text,
    amount,
    isIncome,
    transfer,
    category,
    updatedBy: userId,
    updatedAt: new Date(),
    account: '',
    owner: '',
    createdBy: '',
    recurring: recurring,
    recurrenceType: recurring ? recurrenceType : null,
    recurrenceEndDate: recurring ? new Date(recurrenceEndDate) : null,
    currency: currency,
  };

  if (createdAt) {
    transactionData['createdAt'] = new Date(createdAt);
  }

  // validate transaction
  const validTransaction = await db.query.Transaction.findFirst({
    where: eq(Transaction.id, id),
  });

  if (!validTransaction) {
    throw new HTTPException(400, { message: 'Transaction not found' });
  }

  // validate account balance
  const validBalance = await db.query.Account.findFirst({
    where: eq(Account.id, validTransaction.account as string),
  });

  const amountDifference = transactionData.amount - validTransaction.amount;
  const typeChanged = validTransaction.isIncome !== transactionData.isIncome;
  const amountChanged = amountDifference !== 0;

  let typeChange = 0;
  let amountChange = 0;

  if (typeChanged) {
    typeChange = transactionData.isIncome ? transactionData.amount : -transactionData.amount;
  } else if (amountChanged) {
    amountChange = transactionData.isIncome ? amountDifference : -amountDifference;
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
      [typeChangeField]: increment(typeChangeField, typeChangeValue),
      balance: increment('balance', typeChange),
    };
  }

  if (amountChange !== 0) {
    const amountChangeField = transactionData.isIncome ? 'income' : 'expense';
    const amountChangeValue = Math.max(Math.abs(amountChange), 0);

    updateOperation = {
      ...updateOperation,
      [amountChangeField]: increment(amountChangeField, amountChangeValue),
      balance: increment('balance', amountChange),
    };
  }

  /* The below code is using the `await` keyword to handle asynchronous operations within a
    database transaction. Here's a breakdown of what the code is doing: */
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
          .set({ balance: sql`${Account.balance} + ${totalChange}` })
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
    })
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  // return response
  return c.json({
    message: 'Transaction updated successfully',
  });
});

// DELETE /:id - Delete a transaction
transactionRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    // get query params
    const { id } = c.req.param();

    // get userId from token
    const userId = await c.get('userId' as any);

    // validate transaction
    const validTransaction = await db.query.Transaction.findFirst({
      where: eq(Transaction.id, id),
      columns: {
        account: true,
        amount: true,
        isIncome: true,
        createdBy: true,
        owner: true,
      },
    });

    // validate transaction exists and belongs to the user
    if (!validTransaction) {
      throw new HTTPException(400, { message: 'Transaction not found' });
    }

    // validate user
    if (userId !== validTransaction.createdBy || userId !== validTransaction.owner) {
      throw new HTTPException(400, {
        message: 'You are not authorized to delete this transaction',
      });
    }

    // validate account
    const accountData = await db.query.Account.findFirst({
      where: eq(Account.id, validTransaction.account as string),
      columns: {
        balance: true,
      },
    });

    // validate account analytics
    const analyticsData = await db.query.Analytics.findFirst({
      where: eq(Analytics.account, validTransaction.account as string),
      columns: {
        income: true,
        expense: true,
        balance: true,
      },
    });

    const updatedAccountBalance = accountData?.balance! - validTransaction.amount;

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

    // delete transaction
    await db.delete(Transaction).where(eq(Transaction.id, id));

    // return response
    return c.json({
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : 'Something went wrong',
    });
  }
});

// GET /transactions/recurring - Get a list of all recurring transactions for a user
transactionRouter.get('/recurring', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);
  const { page = 1, pageSize = 10 } = c.req.query();

  const totalCount = await db
    .select({ count: count(Transaction.id) })
    .from(Transaction)
    .where(and(eq(Transaction.owner, userId), eq(Transaction.recurring, true)))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  const recurringTransactions = await db
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
      recurring: Transaction.recurring,
      recurrenceType: Transaction.recurrenceType,
      recurrenceEndDate: Transaction.recurrenceEndDate,
      currency: Transaction.currency,
    })
    .from(Transaction)
    .leftJoin(Category, eq(Category.id, Transaction.category))
    .where(and(eq(Transaction.owner, userId), eq(Transaction.recurring, true)))
    .limit(+pageSize)
    .offset(+pageSize * (+page - 1))
    .orderBy(desc(Transaction.createdAt))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json({
    transactions: recurringTransactions,
    totalCount: totalCount[0].count,
    totalPages: Math.ceil(totalCount[0].count / +pageSize),
    currentPage: +page,
    pageSize: +pageSize,
  });
});

// GET /transactions/recurring/:id - Get details of a specific recurring transaction
transactionRouter.get('/recurring/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = await c.get('userId' as any);

  const recurringTransaction = await db
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
      recurring: Transaction.recurring,
      recurrenceType: Transaction.recurrenceType,
      recurrenceEndDate: Transaction.recurrenceEndDate,
      currency: Transaction.currency,
    })
    .from(Transaction)
    .leftJoin(Category, eq(Category.id, Transaction.category))
    .where(
      and(eq(Transaction.owner, userId), eq(Transaction.id, id), eq(Transaction.recurring, true)),
    )
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  if (!recurringTransaction) {
    throw new HTTPException(404, { message: 'Recurring transaction not found' });
  }

  return c.json({ transaction: recurringTransaction[0] });
});

// PUT /transactions/recurring/:id - Update a specific recurring transaction
transactionRouter.put(
  '/recurring/:id',
  authMiddleware,
  zValidator('json', transactionSchema),
  async (c) => {
    const { id } = c.req.param();
    // get body params
    const {
      text,
      amount,
      isIncome,
      transfer,
      category,
      createdAt,
      recurring,
      recurrenceType,
      recurrenceEndDate,
      currency,
    } = await c.req.json();

    // get userId from token
    const userId = await c.get('userId' as any);

    // prepare transaction data
    let transactionData: InferInsertModel<typeof Transaction> = {
      text,
      amount,
      isIncome,
      transfer,
      category,
      updatedBy: userId,
      updatedAt: new Date(),
      account: '',
      owner: '',
      createdBy: '',
      recurring: recurring,
      recurrenceType: recurring ? recurrenceType : null,
      recurrenceEndDate: recurring ? new Date(recurrenceEndDate) : null,
      currency: currency,
    };

    if (createdAt) {
      transactionData['createdAt'] = new Date(createdAt);
    }

    // validate transaction
    const validTransaction = await db.query.Transaction.findFirst({
      where: and(eq(Transaction.id, id), eq(Transaction.recurring, true)),
    });

    if (!validTransaction) {
      throw new HTTPException(400, { message: 'Transaction not found' });
    }

    // validate account balance
    const validBalance = await db.query.Account.findFirst({
      where: eq(Account.id, validTransaction.account as string),
    });

    const amountDifference = transactionData.amount - validTransaction.amount;
    const typeChanged = validTransaction.isIncome !== transactionData.isIncome;
    const amountChanged = amountDifference !== 0;

    let typeChange = 0;
    let amountChange = 0;

    if (typeChanged) {
      typeChange = transactionData.isIncome ? transactionData.amount : -transactionData.amount;
    } else if (amountChanged) {
      amountChange = transactionData.isIncome ? amountDifference : -amountDifference;
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
        [typeChangeField]: increment(typeChangeField, typeChangeValue),
        balance: increment('balance', typeChange),
      };
    }

    if (amountChange !== 0) {
      const amountChangeField = transactionData.isIncome ? 'income' : 'expense';
      const amountChangeValue = Math.max(Math.abs(amountChange), 0);

      updateOperation = {
        ...updateOperation,
        [amountChangeField]: increment(amountChangeField, amountChangeValue),
        balance: increment('balance', amountChange),
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
            .set({ balance: sql`${Account.balance} + ${totalChange}` })
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
      })
      .catch((err) => {
        throw new HTTPException(500, { message: err.message });
      });

    return c.json({ message: 'Recurring transaction updated successfully' });
  },
);

// DELETE /transactions/recurring/:id - Delete a specific recurring transaction
transactionRouter.delete('/recurring/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = await c.get('userId' as any);

  // validate transaction
  const validTransaction = await db.query.Transaction.findFirst({
    where: and(eq(Transaction.id, id), eq(Transaction.recurring, true)),
    columns: {
      account: true,
      amount: true,
      isIncome: true,
      createdBy: true,
      owner: true,
    },
  });

  // validate transaction exists and belongs to the user
  if (!validTransaction) {
    throw new HTTPException(400, { message: 'Transaction not found' });
  }

  // validate user
  if (userId !== validTransaction.createdBy || userId !== validTransaction.owner) {
    throw new HTTPException(400, {
      message: 'You are not authorized to delete this transaction',
    });
  }

  // validate account
  const accountData = await db.query.Account.findFirst({
    where: eq(Account.id, validTransaction.account as string),
    columns: {
      balance: true,
    },
  });

  // validate account analytics
  const analyticsData = await db.query.Analytics.findFirst({
    where: eq(Analytics.account, validTransaction.account as string),
    columns: {
      income: true,
      expense: true,
      balance: true,
    },
  });

  const updatedAccountBalance = accountData?.balance! - validTransaction.amount;

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

  // delete transaction
  await db.delete(Transaction).where(eq(Transaction.id, id));

  return c.json({ message: 'Recurring transaction deleted successfully' });
});

// POST /transactions/recurring/:id/skip - Skip next occurrence of a recurring transaction
transactionRouter.post('/recurring/:id/skip', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const userId = await c.get('userId' as any);

  // validate transaction
  const validTransaction = await db.query.Transaction.findFirst({
    where: and(eq(Transaction.id, id), eq(Transaction.recurring, true)),
    columns: {
      recurrenceEndDate: true,
      recurrenceType: true,
    },
  });

  // validate transaction exists and belongs to the user
  if (!validTransaction) {
    throw new HTTPException(400, { message: 'Transaction not found' });
  }

  let newRecurrenceEndDate = null;

  if (validTransaction.recurrenceEndDate) {
    let date = new Date(validTransaction.recurrenceEndDate);

    switch (validTransaction.recurrenceType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        break;
    }

    newRecurrenceEndDate = date;
  }

  await db
    .update(Transaction)
    .set({ recurrenceEndDate: newRecurrenceEndDate })
    .where(and(eq(Transaction.id, id), eq(Transaction.owner, userId)));

  return c.json({ message: 'Recurring transaction skipped successfully' });
});

export default transactionRouter;
