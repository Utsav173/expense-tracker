import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { accountSchema } from '../utils/schema.validations';
import { db } from '../database';
import {
  Account,
  Analytics,
  Category,
  ImportData,
  Transaction,
  User,
  UserAccount,
} from '../database/schema';
import { HTTPException } from 'hono/http-exception';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
  InferInsertModel,
  ne,
  inArray,
  SQL,
  gt,
  lt,
} from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { read, utils, write } from 'xlsx';
import { BunFile } from 'bun';
import handleAnalytics from '../utils/handleAnalytics';
import { calcPercentageChange, getIntervalValue, getSQLInterval } from '../utils';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import path from 'path';

const accountRouter = new Hono();

// GET /dashboard - Retrieve dashboard data for authenticated user
accountRouter.get('/dashboard', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);
    const accountsInfo = await db
      .select({
        id: Account.id,
        name: Account.name,
        balance: Account.balance,
        income: Analytics.income,
        expense: Analytics.expense,
      })
      .from(Account)
      .where(eq(Account.owner, userId))
      .leftJoin(Analytics, eq(Analytics.account, Account.id))
      .orderBy(desc(Analytics.balance));

    if (accountsInfo.length < 2 && accountsInfo[0].income === 0 && accountsInfo[0].expense === 0) {
      return c.json({
        accountsInfo,
        transactionsCountByAccount: { [accountsInfo[0].name]: 0 },
        totalTransaction: 0,
        mostExpensiveExpense: 0,
        cheapestExpense: 0,
        mostExpensiveIncome: 0,
        cheapestIncome: 0,
        incomeData: [],
        expenseData: [],
        balanceData: [],
        overallIncome: 0,
        overallExpense: 0,
        overallBalance: 0,
        overallIncomeChange: 0,
        overallExpenseChange: 0,
      });
    }

    const [
      transactionsCountByAccountQuery,
      [{ count: totalTransaction }],
      [{ cheapestExpense, mostExpensiveExpense, cheapestIncome, mostExpensiveIncome }],
      [{ incomeData, expenseData, balanceData }],
      dashboardDataQuery,
    ] = await Promise.all([
      db
        .execute(
          sql`
      WITH account_counts AS (
        SELECT
          a.name,
          COUNT(t.id) AS count
        FROM public.account as a
        LEFT JOIN public.transaction as t
          ON a.id = t.account
        WHERE a.owner = ${userId}
        GROUP BY a.name
      )
      SELECT
        json_object_agg(name, count) AS count_data
      FROM account_counts;
    `,
        )
        .then((res) => res.rows),
      db
        .select({
          count: count(Transaction.id),
        })
        .from(Transaction)
        .where(eq(Transaction.owner, userId)),
      db
        .execute(
          sql`
        SELECT
          MAX(COALESCE(amount, 0)) FILTER (WHERE "isIncome" = FALSE) AS "mostExpensiveExpense",
          MIN(COALESCE(amount, 0)) FILTER (WHERE "isIncome" = FALSE) AS "cheapestExpense",
          MAX(COALESCE(amount, 0)) FILTER (WHERE "isIncome" = TRUE) AS "mostExpensiveIncome",
          MIN(COALESCE(amount, 0)) FILTER (WHERE "isIncome" = TRUE) AS "cheapestIncome"
        FROM public.transaction
        WHERE owner = ${userId};
      `,
        )
        .then((res) => res.rows),
      db
        .execute(
          sql`
      WITH daily_data AS (
        SELECT
          DATE_TRUNC('day', "createdAt") AS date,
          SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN "isIncome" = FALSE THEN amount ELSE 0 END) AS expense,
          SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE 0 END) - SUM(CASE WHEN "isIncome" = FALSE THEN amount ELSE 0 END) AS balance
        FROM public.transaction
        WHERE owner = ${userId}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY DATE_TRUNC('day', "createdAt") ASC
      )
      SELECT
        json_agg(json_build_object('x', EXTRACT(EPOCH FROM date)::BIGINT, 'y', income)) AS "incomeData",
        json_agg(json_build_object('x', EXTRACT(EPOCH FROM date)::BIGINT, 'y', expense)) AS "expenseData",
        json_agg(json_build_object('x', EXTRACT(EPOCH FROM date)::BIGINT, 'y', balance)) AS "balanceData"
      FROM daily_data;    
    `,
        )
        .then((res) => res.rows),
      db
        .execute(
          sql`
        WITH analytics_summary AS (
          SELECT
            a.account,
            SUM(a.income) AS total_income,
            SUM(a.expense) AS total_expenses,
            SUM(a.balance) AS total_balance,
            AVG(a."incomePercentageChange") AS avg_income_percentage_change,
            AVG(a."expensesPercentageChange") AS avg_expenses_percentage_change
          FROM
            analytics a
          JOIN
            account acc ON a.account = acc.id
          WHERE
            acc.owner = ${userId}
          GROUP BY
            a.account
        )
        SELECT
          COALESCE(SUM(s.total_income), 0) AS overall_income,
          COALESCE(SUM(s.total_expenses), 0) AS overall_expense,
          COALESCE(SUM(s.total_balance), 0) AS overall_balance,
          COALESCE(AVG(s.avg_income_percentage_change), 0) AS overall_income_percentage_change,
          COALESCE(AVG(s.avg_expenses_percentage_change), 0) AS overall_expense_percentage_change
        FROM
          analytics_summary s;
      `,
        )
        .then((res) => res.rows),
    ]);

    // Extracting overall data
    const overallData = dashboardDataQuery.length > 0 ? dashboardDataQuery[0] : {};
    const overallIncome = overallData.overall_income;
    const overallExpense = overallData.overall_expense;
    const overallBalance = overallData.overall_balance;
    const overallIncomeChange = overallData.overall_income_percentage_change;
    const overallExpenseChange = overallData.overall_expense_percentage_change;

    return c.json({
      accountsInfo,
      transactionsCountByAccount: transactionsCountByAccountQuery[0].count_data,
      totalTransaction,
      mostExpensiveExpense: Number(mostExpensiveExpense),
      cheapestExpense: Number(cheapestExpense),
      mostExpensiveIncome: Number(mostExpensiveIncome),
      cheapestIncome: Number(cheapestIncome),
      incomeChartData: incomeData,
      expenseChartData: expenseData,
      balanceChartData: balanceData,
      overallIncome,
      overallExpense,
      overallBalance,
      overallIncomeChange: +Number(overallIncomeChange).toFixed(2),
      overallExpenseChange: +Number(overallExpenseChange).toFixed(2),
    });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});

// GET /searchTerm - Search for transactions based on a search term
accountRouter.get('/searchTerm', authMiddleware, async (c) => {
  const searchTerm = c.req.query('q');
  const userId = await c.get('userId' as any);

  if (!searchTerm || !searchTerm.trim().length) {
    throw new HTTPException(400, { message: 'Search query is required' });
  }

  const selectQuery = sql` SELECT
          t.id,
          t."createdAt",
          t."updatedAt",
          t.text,
          t.amount,
          t."isIncome",
          t.transfer,
          t.account,
          c.name AS category
        FROM transaction t
        LEFT JOIN category c ON t.category = c.id
        `;

  let whereQuery = sql``;

  if (!Number.isNaN(Number(searchTerm))) {
    whereQuery = sql`
      WHERE (
        t.amount = CAST(${searchTerm} AS real) OR
        t.text ILIKE ${'%' + searchTerm + '%'} OR
        t.transfer ILIKE ${'%' + searchTerm + '%'} OR
        c.name ILIKE ${'%' + searchTerm + '%'}
      )
      AND (
        t.owner = ${userId} OR
        t."createdBy" = ${userId} OR
        t."updatedBy" = ${userId}
      )
      ORDER BY t."createdAt" DESC
      LIMIT 20`;
  } else {
    whereQuery = sql`
      WHERE (
        t.text ILIKE ${'%' + searchTerm + '%'} OR
        t.transfer ILIKE ${'%' + searchTerm + '%'} OR
        c.name ILIKE ${'%' + searchTerm + '%'}
      )
      AND (
        t.owner = ${userId} OR
        t."createdBy" = ${userId} OR
        t."updatedBy" = ${userId}
      )
      ORDER BY t."createdAt" DESC
      LIMIT 20`;
  }

  const result = await db.execute(sql``.append(selectQuery).append(whereQuery)).catch((err) => {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  });

  return c.json(result);
});

// GET /dropdown/user - Retrieve users for dropdown selection (excluding current user)
accountRouter.get('/dropdown/user', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);
  const userData = await db.query.User.findMany({
    where(fields, operators) {
      return operators.and(eq(fields.role, 'user'), ne(fields.id, userId));
    },
    columns: {
      id: true,
      name: true,
      email: true,
      profilePic: true,
    },
  }).catch((err) => {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  });
  return c.json(userData);
});

// POST /share - Share an account with another user
accountRouter.post('/share', authMiddleware, async (c) => {
  const { accountId, userId } = await c.req.json();

  if (!accountId || !userId) {
    throw new HTTPException(400, {
      message: 'Account id and user id are required',
    });
  }

  const isValidAccount = await db.query.Account.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, accountId);
    },
  });

  if (!isValidAccount) {
    throw new HTTPException(400, { message: 'Account not found' });
  }

  const validUser = await db.query.User.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, userId);
    },
    columns: { id: true, email: true },
    with: { accounts: true },
  });

  if (!validUser) {
    throw new HTTPException(400, { message: 'User not found' });
  }

  if (validUser.accounts.includes(accountId)) {
    throw new HTTPException(400, {
      message: 'User cannot be shared with the account',
    });
  }

  const isUserExist = await db.query.UserAccount.findMany({
    where(fields, operators) {
      return operators.and(eq(fields.accountId, accountId), eq(fields.userId, userId));
    },
  });
  if (isUserExist.length > 0) {
    throw new HTTPException(400, {
      message: 'User already shared with the account',
    });
  } else {
    await db
      .insert(UserAccount)
      .values({ accountId, userId })
      .catch((err) => {
        throw new HTTPException(400, { message: err.message });
      });
  }

  const trapmail = {
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'bde7259ba0b2a4',
      pass: '77b9c19e118ee0',
    },
  };

  const google = {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_PASS,
    },
  };

  const transporter = nodemailer.createTransport(trapmail);
  // const acceptInviteUrl = `${req.protocol}://${req.headers.host}/api/account/invite/accept/${inviteData.id}`;
  const mailOptions = {
    from: 'expenssManger1234@gmail.com',
    to: validUser.email,
    subject: 'Invitation to account',
    html: `
            <!DOCTYPE html>
            <html lang="en">        
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Account Invitation</title>
            </head>        
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">        
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">        
                    <h2 style="text-align: center; color: #007bff;">Account Invitation</h2>        
                    <p>Hello,</p>        
                    <p>Account ${isValidAccount.name} has been shared with you.</p>             
                </div>        
            </body>        
            </html>
          `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err.message);
    } else {
      // console.log(info.response);
    }
  });

  return c.json({ message: 'Account shared successfully' });
});

// POST /import/transaction - Import transactions from an Excel file
accountRouter.post('/import/transaction', authMiddleware, async (c) => {
  const body = await c.req.formData();
  const accountId = body.get('accountId');
  const docFile = body.get('document') as unknown as BunFile;

  if (!accountId || !docFile) {
    throw new HTTPException(400, {
      message: 'Account id and document file are required',
    });
  }

  const [validAccount, workbook, userId] = await Promise.all([
    db.query.Account.findFirst({
      where: eq(Account.id, accountId as string),
    }),
    read(Buffer.from(await docFile.arrayBuffer()), { type: 'buffer' }),
    c.get('userId' as any),
  ]);

  if (!validAccount) {
    throw new HTTPException(400, { message: 'Account not found' });
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new HTTPException(400, { message: 'Document is empty' });
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new HTTPException(400, { message: 'No sheet found in the workbook' });
  }

  const jsonData: any[] = utils.sheet_to_json(worksheet);

  const requiredHeaders = ['Text', 'Amount', 'Type', 'Transfer', 'Category', 'Date'];
  const fileHeaders = Object.keys(jsonData[0] as any);

  // check if fileHeaders contains all requiredHeaders
  const containsAllHeaders = requiredHeaders.every((header) => fileHeaders.includes(header));

  if (!containsAllHeaders) {
    throw new HTTPException(400, { message: 'Missing required headers' });
  }

  const existingCategories = await db.query.Category.findMany({
    where: inArray(
      Category.name,
      jsonData.map((item) => item.Category),
    ),
  });
  const categoryNameToIdMap = new Map(
    existingCategories.map((category) => [category.name, category.id]),
  );

  const finalArray = jsonData.map((item) => {
    const typedItem = item as Record<string, any>;

    const temp: any = {
      account: accountId as string,
      owner: userId,
      createdBy: userId,
      updatedBy: userId,
    };

    for (const key in typedItem) {
      if (requiredHeaders.includes(key)) {
        switch (key.toLowerCase()) {
          case 'type':
            temp['isIncome'] = item[key].toLowerCase() === 'income'; // simplified
            break;
          case 'date':
            temp.createdAt = new Date(item[key]);
            break;
          case 'category':
            // Utilize the map for efficient lookup
            let categoryId = categoryNameToIdMap.get(item[key]);
            if (!categoryId) {
              categoryId = crypto.randomUUID();
              categoryNameToIdMap.set(item[key], categoryId);
            }
            temp.category = categoryId;
            break;
          case 'amount':
            temp.amount = parseFloat(item[key]);
            break;
          default:
            temp[key.toLowerCase()] = item[key];
        }
      }
    }
    return temp;
  });

  // Insert categories outside the loop
  const newCategoryNames = Array.from(categoryNameToIdMap.keys()).filter(
    // Use Array.from here
    (name) => !existingCategories.some((cat) => cat.name === name),
  );

  if (newCategoryNames.length > 0) {
    await db.insert(Category).values(
      newCategoryNames.map((name) => ({
        name,
        owner: userId,
        id: categoryNameToIdMap.get(name),
      })),
    );
  }

  const totalRecords = jsonData.length;
  const successId = await db
    .insert(ImportData)
    .values({
      account: accountId as string,
      user: userId,
      data: JSON.stringify(finalArray),
      totalRecords,
      errorRecords: 0,
    })
    .returning({ id: ImportData.id })
    .then((data) => data[0].id)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json({ message: 'Imported successfully', successId, totalRecords });
});

// GET /sampleFile/import - Download a sample file for importing transactions
accountRouter.get('/sampleFile/import', authMiddleware, (c) => {
  const sampleFile = Bun.file(path.join(__dirname, '../../public/sample/sample_transactions.xlsx'));

  if (!sampleFile) {
    throw new HTTPException(400, { message: 'Sample file not found' });
  }

  const bufferFile = sampleFile.stream();

  return c.newResponse(bufferFile, 200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename=sample_transactions.xlsx',
  });
});

// GET /get-shares - Get accounts shared with the current user
accountRouter.get('/get-shares', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);

  const hasOtherAccounts = await db
    .select({ id: UserAccount.accountId })
    .from(UserAccount)
    .where(eq(UserAccount.userId, userId))
    .limit(1)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  if (!hasOtherAccounts || !hasOtherAccounts.length) {
    throw new HTTPException(400, { message: 'No other accounts found' });
  }

  // extract query params
  const { page = 1, limit = 10, sortOrder = 'desc', search = '' } = await c.req.query();

  const sortBy: keyof InferInsertModel<typeof Account> =
    (c.req.query('sortBy') as any) || 'createdAt';

  // constructed serach condition
  let searchQuery: SQL<unknown> | undefined = inArray(
    Account.id,
    hasOtherAccounts.map((a) => a.id) as any[],
  );

  if (search.length > 0) {
    searchQuery = and(searchQuery, ilike(Account.name, `%${search}%`));
  }

  const accountData = await db
    .select({
      id: Account.id,
      name: Account.name,
      balance: Account.balance,
      createdAt: Account.createdAt,
      analytics: Analytics,
      owner: {
        id: User.id,
        name: User.name,
        email: User.email,
        profilePic: User.profilePic,
      },
    })
    .from(Account)
    .where(searchQuery)
    .leftJoin(User, eq(Account.owner, User.id))
    .leftJoin(Analytics, eq(Analytics.account, Account.id))
    .orderBy(sortOrder === 'desc' ? desc(Account[sortBy]) : asc(Account[sortBy]))
    .limit(+limit)
    .offset(+limit * (+page - 1))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json(accountData);
});

// GET /previous/share/:id - Get previous shares of an account
accountRouter.get('/previous/share/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  const accountData = await db
    .selectDistinct({
      id: UserAccount.accountId,
      name: Account.name,
      balance: Account.balance,
      User: {
        id: User.id,
        name: User.name,
        email: User.email,
        profilePic: User.profilePic,
      },
    })
    .from(UserAccount)
    .where(eq(UserAccount.accountId, id))
    .leftJoin(User, eq(User.id, UserAccount.userId))
    .leftJoin(Account, eq(Account.id, UserAccount.accountId))
    .groupBy(
      UserAccount.accountId,
      Account.name,
      Account.balance,
      User.id,
      User.name,
      User.email,
      User.profilePic,
    )
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json(accountData);
});

// POST /confirm/import/:id - Confirm and import data from an import file
accountRouter.post('/confirm/import/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = await c.get('userId' as any);
  const dataImport = await db.query.ImportData.findFirst({
    where: eq(ImportData.id, id),
  });

  if (!dataImport) {
    throw new HTTPException(404, { message: 'Data not found' });
  }

  const finalData = JSON.parse(dataImport.data);

  for (const item of finalData) {
    const helperData = {
      account: item.account,
      user: userId,
      isIncome: item.isIncome,
      amount: item.amount,
    };

    await db
      .insert(Transaction)
      .values({
        ...item,
        createdAt: new Date(item.createdAt),
      })
      .catch((err) => {
        throw new HTTPException(400, { message: err.message });
      });

    await handleAnalytics(helperData);
  }

  return c.json({ message: 'Data imported successfully' });
});

// GET /customAnalytics/:id - Get custom analytics for an account within a specific duration
accountRouter.get('/customAnalytics/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  const duration = c.req.query('duration');

  if (!duration || !id) {
    throw new HTTPException(400, { message: 'Duration and id are required' });
  }

  const { startDate, endDate } = await getIntervalValue(duration);

  const account = await db.query.Account.findFirst({
    where: eq(Account.id, id),
    columns: { id: true },
  });

  if (!account) {
    throw new HTTPException(404, { message: 'Account not found' });
  }

  const result: any[] = await db
    .execute(
      sql.raw(`
      WITH CurrentPeriodData AS (
          SELECT
              SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE 0 END) AS total_income,
              SUM(CASE WHEN "isIncome" = FALSE THEN amount ELSE 0 END) AS total_expense,
              SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE -amount END) AS total_balance
          FROM transaction
          WHERE
              account = '${id}'
              AND "createdAt" BETWEEN '${startDate}' AND '${endDate}'
      ),

      PreviousPeriodData AS (
          SELECT
              SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE 0 END) AS prev_total_income,
              SUM(CASE WHEN "isIncome" = FALSE THEN amount ELSE 0 END) AS prev_total_expense,
              SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE -amount END) AS prev_total_balance
          FROM transaction
          WHERE
              account = '${id}'
              AND "createdAt" BETWEEN ${getSQLInterval(startDate, endDate)}
      )

      SELECT
          cpd.total_income AS "income",
          cpd.total_expense AS "expense",
          cpd.total_balance AS "balance",
          CASE WHEN (ppd.prev_total_balance = 0 OR ppd.prev_total_balance is null) THEN 100
              ELSE 100.0 * (cpd.total_balance - ppd.prev_total_balance) / ppd.prev_total_balance
          END AS "BalancePercentageChange",
          CASE WHEN (ppd.prev_total_income = 0 OR ppd.prev_total_income is null) THEN 100
              ELSE 100.0 * (cpd.total_income - ppd.prev_total_income) / ppd.prev_total_income
          END AS "IncomePercentageChange",
          CASE WHEN (ppd.prev_total_expense = 0 OR ppd.prev_total_expense is null) THEN 100
              ELSE 100.0 * (cpd.total_expense - ppd.prev_total_expense) / ppd.prev_total_expense
          END AS "ExpensePercentageChange"
      FROM CurrentPeriodData cpd
      LEFT JOIN PreviousPeriodData ppd ON 1=1;
      `),
    )
    .then((res) => res.rows)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  const {
    income,
    expense,
    balance,
    BalancePercentageChange,
    IncomePercentageChange,
    ExpensePercentageChange,
  } = result[0];

  return c.json({
    income,
    expense,
    balance,
    BalancePercentageChange: +Number(BalancePercentageChange).toFixed(2),
    IncomePercentageChange: +Number(IncomePercentageChange).toFixed(2),
    ExpensePercentageChange: +Number(ExpensePercentageChange).toFixed(2),
  });
});

// GET /get/import/:id - Get data from an import file
accountRouter.get('/get/import/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const dataImport = await db.query.ImportData.findFirst({
    where: eq(ImportData.id, id),
  });
  const parseData = JSON.parse(dataImport?.data!);
  const response = {
    length: parseData.length,
    data: parseData,
  };
  return c.json(response);
});

// -----------------------------------------------------------------------------
// Account Routes (CRUD operations for accounts)
// -----------------------------------------------------------------------------

// GET / - Get a list of accounts for the authenticated user
accountRouter.get('/', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);

  // gettig pagination and serach query from url
  const { page = 1, limit = 10, sortOrder = 'desc', search = '' } = c.req.query();

  const sortBy: keyof InferInsertModel<typeof Account> =
    (c.req.query('sortBy') as any) || 'createdAt';

  // constructed serach condition
  const searchCondition = and(
    eq(Account.owner, userId),
    or(
      ilike(Account.name, `%${search}%`),
      eq(Account.balance, typeof search === 'number' ? search : +search),
    ),
  );

  const total = await db
    .select({ tot: count(Account.id) })
    .from(Account)
    .where(searchCondition)
    .then((res) => res[0].tot)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  // Find accounts with pagination and sorting
  const accounts = await db
    .select({
      id: Account.id,
      name: Account.name,
      balance: Account.balance,
      createdAt: Account.createdAt,
      analytics: Analytics,
      owner: {
        id: User.id,
        name: User.name,
        email: User.email,
        profilePic: User.profilePic,
      },
      currency: Account.currency,
    })
    .from(Account)
    .leftJoin(Analytics, eq(Analytics.account, Account.id))
    .leftJoin(User, eq(User.id, Account.owner))
    .where(searchCondition)
    .limit(+limit)
    .offset(+limit * (+page - 1))
    .orderBy(sortOrder === 'asc' ? asc(Account[sortBy]) : desc(Account[sortBy]))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json({
    accounts,
    total,
    limit: +limit,
    page: +page,
    totalPage: Math.ceil(total / Number(limit)),
  });
});

accountRouter.get('/list', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);
  const accounts = await db
    .select({
      id: Account.id,
      name: Account.name,
      currency: Account.currency,
    })
    .from(Account)
    .where(eq(Account.owner, userId))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message + ' 1' });
    });
  return c.json(accounts);
});

// POST / - Create a new account
accountRouter.post('/', authMiddleware, zValidator('json', accountSchema), async (c) => {
  const { name, balance, currency } = await c.req.json();
  const userId = await c.get('userId' as any);

  // check if account with name already exists
  const account = await db
    .select({ id: Account.id })
    .from(Account)
    .where(eq(Account.name, name))
    .catch((err) => {
      throw new HTTPException(500, { message: err.message + ' 1' });
    });

  if (account.length > 0) {
    throw new HTTPException(409, { message: 'Account already exists' });
  }

  const accountData = await db
    .insert(Account)
    .values({
      name,
      balance,
      owner: userId,
      currency,
    })
    .returning()
    .catch((err) => {
      throw new HTTPException(500, { message: err.message + ' 1' });
    });

  await db.insert(Analytics).values({
    account: accountData[0].id,
    balance,
    user: userId,
  });

  let categoryData = await db.query.Category.findFirst({
    where(fields, operators) {
      return operators.and(
        eq(fields.name, 'Opening Balance'),
        or(eq(fields.owner, accountData[0].owner), isNull(fields.owner)),
      );
    },
  });

  if (categoryData === undefined) {
    categoryData = await db
      .insert(Category)
      .values({
        name: 'Opening Balance',
        owner: userId,
      })
      .onConflictDoUpdate({
        set: { name: 'Opening Balance' },
        target: [Category.name, Category.owner],
      })
      .returning()
      .then((data) => data[0])
      .catch((err) => {
        throw new HTTPException(500, { message: err.message + ' 2' });
      });
  }
  await db.insert(Transaction).values({
    amount: balance,
    category: categoryData.id,
    account: accountData[0].id,
    text: 'Opening Balance',
    isIncome: true,
    owner: userId,
    createdBy: userId,
    transfer: 'self',
    updatedBy: userId,
    currency: currency,
  });
  return c.json({
    message: 'Account created successfully',
    data: accountData[0],
  });
});

// GET /:id/statement - Generate an account statement PDF
accountRouter.get('/:id/statement', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const { startDate, endDate, numTransactions, exportType } = c.req.query();

    if (!startDate && !endDate && !numTransactions) {
      throw new HTTPException(400, {
        message: 'Start date, end date and number of transactions are required',
      });
    }

    if (exportType !== 'pdf' && exportType !== 'xlsx') {
      throw new HTTPException(400, { message: 'Export type must be pdf or xlsx' });
    }

    const validAccount = await db.query.Account.findFirst({
      where: eq(Account.id, id),
    });

    if (!validAccount) {
      throw new HTTPException(404, { message: 'Account not found' });
    }

    let transactions: any[];

    if (startDate && endDate) {
      transactions = await db.query.Transaction.findMany({
        where: and(
          eq(Transaction.account, id),
          and(
            gt(Transaction.createdAt, new Date(startDate as any)),
            lt(Transaction.createdAt, new Date(endDate as any)),
          ),
        ),
        columns: {
          id: true,
          createdAt: true,
          updatedAt: true,
          text: true,
          amount: true,
          isIncome: true,
          transfer: true,
          account: true,
          currency: true, // Include transaction currency here
        },
        with: {
          category: true,
          createdBy: {
            columns: {
              id: true,
              name: true,
              email: true,
              profilePic: true,
            },
          },
        },
        orderBy: desc(Transaction.createdAt),
      });
    } else {
      transactions = await db.query.Transaction.findMany({
        where: eq(Transaction.account, id),
        columns: {
          id: true,
          createdAt: true,
          updatedAt: true,
          text: true,
          amount: true,
          isIncome: true,
          transfer: true,
          account: true,
          currency: true, // Include transaction currency here
        },
        with: {
          category: true,
          createdBy: {
            columns: {
              id: true,
              name: true,
              email: true,
              profilePic: true,
            },
          },
        },
        orderBy: desc(Transaction.createdAt),
        limit: +numTransactions,
      });
    }

    if (!transactions.length) {
      throw new HTTPException(404, { message: 'No transactions found' });
    }

    // Calculate analytics
    const totalIncome = transactions.reduce((acc, transaction) => {
      if (transaction.isIncome) {
        return acc + transaction.amount;
      }
      return acc;
    }, 0);

    const totalExpense = transactions.reduce((acc, transaction) => {
      if (!transaction.isIncome) {
        return acc + transaction.amount;
      }
      return acc;
    }, 0);

    const balance = totalIncome - totalExpense;

    const incomePercentageChange = calcPercentageChange(
      transactions.filter((t) => t.isIncome).map((t) => t.amount),
    );
    const expensePercentageChange = calcPercentageChange(
      transactions.filter((t) => !t.isIncome).map((t) => t.amount),
    );
    if (exportType == 'pdf') {
      // Render EJS template
      const html = await ejs.renderFile(
        path.join(__dirname, '../../public/template/statement.ejs'),
        {
          transactions,
          totalIncome,
          totalExpense,
          balance,
          incomePercentageChange,
          expensePercentageChange,
        },
      );

      // Create PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html);
      const pdfBuffer = await page.createPDFStream();
      // await browser.close();

      return c.newResponse(pdfBuffer, 200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=statement.pdf',
      });
    } else if (exportType === 'xlsx') {
      const transactionsData = transactions.map((transaction) => [
        new Date(transaction.createdAt).toLocaleDateString(),
        transaction.text,
        transaction.isIncome ? transaction.amount : -transaction.amount,
        transaction.category?.name,
        transaction.currency, // Include transaction currency in the Excel file
      ]);

      const worksheetData = [
        ['Total Income', 'Total Expense', 'Balance', 'Income % Change', 'Expense % Change'],
        [totalIncome, totalExpense, balance, incomePercentageChange, expensePercentageChange],
        ['Date', 'Text', 'Amount', 'Category', 'Currency'], // Add "Currency" header
        ...transactionsData,
      ];

      const workbook = utils.book_new();
      const worksheet = utils.aoa_to_sheet(worksheetData);
      utils.book_append_sheet(workbook, worksheet, 'Statement');

      const buffer = write(workbook, { bookType: 'xlsx', type: 'buffer' });

      // Return XLSX file
      return c.newResponse(buffer, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=statement.xlsx',
      });
    }
  } catch (error) {
    console.log(error);
  }
});

// GET /account/:id - Get an account
accountRouter.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();

  const accountData = await db
    .select({
      id: Account.id,
      name: Account.name,
      balance: Account.balance,
      createdAt: Account.createdAt,
      updatedAt: Account.updatedAt,
      owner: {
        id: User.id,
        name: User.name,
        email: User.email,
        profilePic: User.profilePic,
      },
      analytics: Analytics,
      currency: Account.currency,
    })
    .from(Account)
    .leftJoin(Analytics, eq(Analytics.account, Account.id))
    .leftJoin(User, eq(User.id, Account.owner))
    .where(eq(Account.id, id))
    .catch((err) => {
      throw new HTTPException(400, { message: err.message });
    });
  return c.json(accountData);
});

// PUT /account/:id - Update an account
accountRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const { name, balance, currency } = await c.req.json();
    await db
      .transaction(async (tx) => {
        await tx
          .update(Account)
          .set({ name, balance, currency })
          .where(eq(Account.id, c.req.param('id')))
          .returning()
          .catch((err) => {
            throw new HTTPException(400, { message: err.message });
          });

        await tx
          .update(Analytics)
          .set({ balance })
          .where(eq(Analytics.account, c.req.param('id')));
      })
      .catch((err) => {
        throw new HTTPException(500, { message: err.message });
      });
    return c.json({
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.log(error);
  }
});

// DELETE /account/:id - Delete an account
accountRouter.delete('/:id', authMiddleware, async (c) => {
  const userId = await c.get('userId' as any);

  const validUser = await db.query.Account.findFirst({
    where: and(eq(Account.owner, userId), eq(Account.id, c.req.param('id'))),
  });

  if (!validUser) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(Transaction)
      .where(eq(Transaction.account, c.req.param('id')))
      .catch((err) => {
        throw new HTTPException(400, { message: err.message });
      });

    await tx
      .delete(Analytics)
      .where(eq(Analytics.account, c.req.param('id')))
      .catch((err) => {
        throw new HTTPException(400, { message: err.message });
      });

    await tx
      .delete(Account)
      .where(eq(Account.id, c.req.param('id')))
      .catch((err) => {
        throw new HTTPException(400, { message: err.message });
      });
  });
  return c.json({
    message: 'Account deleted successfully',
  });
});

export default accountRouter;
