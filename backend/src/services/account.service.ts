import { db } from '../database';
import {
  Account,
  Analytics,
  Category,
  ImportData,
  Transaction,
  User,
  UserAccount,
  Debts,
} from '../database/schema';
import {
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  InferInsertModel,
  InferSelectModel,
  ne,
  inArray,
  gt,
  lt,
  SQLWrapper,
} from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { read, utils, write } from 'xlsx';
import { BunFile } from 'bun';
import path from 'path';

import ejs from 'ejs';
import { analyticsService } from './analytics.service';
import { getIntervalValue, getSQLInterval } from '../utils/date.utils';
import { emailService } from './email.service';
import { pdfService } from './pdf.service';

type AccountInsert = InferInsertModel<typeof Account>;
type AccountSelect = InferSelectModel<typeof Account>;

export class AccountService {
  async getDashboardData(userId: string) {
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
      return {
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
      };
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

    const overallData = dashboardDataQuery.length > 0 ? dashboardDataQuery[0] : {};
    const overallIncome = overallData.overall_income;
    const overallExpense = overallData.overall_expense;
    const overallBalance = overallData.overall_balance;
    const overallIncomeChange = overallData.overall_income_percentage_change;
    const overallExpenseChange = overallData.overall_expense_percentage_change;

    return {
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
    };
  }

  async searchTransactions(userId: string, searchTerm: string | undefined) {
    if (!searchTerm || !searchTerm.trim().length) {
      throw new HTTPException(400, { message: 'Search query is required' });
    }

    const searchTermLower = searchTerm.toLowerCase();
    const searchNum = Number(searchTerm);
    const isNumericSearch = !isNaN(searchNum);

    const results = await db
      .select({
        id: Transaction.id,
        createdAt: Transaction.createdAt,
        updatedAt: Transaction.updatedAt,
        text: Transaction.text,
        amount: Transaction.amount,
        isIncome: Transaction.isIncome,
        transfer: Transaction.transfer,
        account: Transaction.account,
        categoryName: Category.name,
      })
      .from(Transaction)
      .leftJoin(Category, eq(Transaction.category, Category.id))
      .where(
        and(
          eq(Transaction.owner, userId),
          or(
            ilike(Transaction.text, `%${searchTerm}%`),
            ilike(Transaction.transfer, `%${searchTerm}%`),
            ilike(Category.name, `%${searchTerm}%`),
            isNumericSearch ? eq(Transaction.amount, searchNum) : undefined,
          ),
        ),
      )
      .orderBy(desc(Transaction.createdAt))
      .limit(20)
      .catch((err) => {
        throw new HTTPException(500, {
          message: `Failed to search transactions: ${err.message}`,
        });
      });

    return results;
  }

  async getUsersForDropdown(currentUserId: string) {
    return db.query.User.findMany({
      where: and(eq(User.role, 'user'), ne(User.id, currentUserId)),
      columns: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
      },
    }).catch((err) => {
      throw new HTTPException(500, { message: `Failed to fetch users: ${err.message}` });
    });
  }

  async shareAccount(accountId: string, targetUserId: string, ownerId: string) {
    if (!accountId || !targetUserId) {
      throw new HTTPException(400, {
        message: 'Account ID and target User ID are required',
      });
    }

    const account = await db.query.Account.findFirst({
      where: and(eq(Account.id, accountId), eq(Account.owner, ownerId)),
      columns: { id: true, name: true },
    });
    if (!account) {
      throw new HTTPException(403, {
        message: 'Account not found or you do not have permission to share it.',
      });
    }

    const targetUser = await db.query.User.findFirst({
      where: eq(User.id, targetUserId),
      columns: { id: true, email: true },
    });
    if (!targetUser) {
      throw new HTTPException(404, { message: 'Target user not found' });
    }

    const existingShare = await db.query.UserAccount.findFirst({
      where: and(eq(UserAccount.accountId, accountId), eq(UserAccount.userId, targetUserId)),
    });
    if (existingShare) {
      throw new HTTPException(409, { message: 'Account already shared with this user' });
    }

    await db
      .insert(UserAccount)
      .values({ accountId, userId: targetUserId })
      .catch((err) => {
        throw new HTTPException(500, { message: `Failed to share account: ${err.message}` });
      });

    emailService.sendShareNotificationEmail(targetUser.email, account.name);

    return { message: 'Account shared successfully' };
  }

  async processImportFile(accountId: string, userId: string, docFile: BunFile) {
    const [validAccount, workbook] = await Promise.all([
      db.query.Account.findFirst({
        where: eq(Account.id, accountId as string),
      }),
      read(Buffer.from(await docFile.arrayBuffer()), { type: 'buffer' }),
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

    const containsAllHeaders = requiredHeaders.every((header) => fileHeaders.includes(header));

    if (!containsAllHeaders) {
      throw new HTTPException(400, { message: 'Missing required headers' });
    }

    // START: Logic for handling dynamic category creation (identical to original)
    const categoryNamesFromImport = [
      ...new Set(jsonData.map((item) => item.Category).filter(Boolean)),
    ];

    const existingCategories = await db.query.Category.findMany({
      where: and(eq(Category.owner, userId), inArray(Category.name, categoryNamesFromImport)),
    });

    const categoryNameToIdMap = new Map(
      existingCategories.map((category) => [category.name, category.id]),
    );

    const newCategoryNames = categoryNamesFromImport.filter(
      (name) => !categoryNameToIdMap.has(name),
    );

    if (newCategoryNames.length > 0) {
      const newCategoriesToInsert = newCategoryNames.map((name) => ({
        name,
        owner: userId,
      }));
      const inserted = await db.insert(Category).values(newCategoriesToInsert).returning();
      inserted.forEach((cat) => categoryNameToIdMap.set(cat.name, cat.id));
    }
    // END: Logic for handling dynamic category creation

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
              temp['isIncome'] = item[key].toLowerCase() === 'income';
              break;
            case 'date':
              temp.createdAt = new Date(item[key]);
              break;
            case 'category':
              // Use the map to get the ID for the category name
              temp.category = categoryNameToIdMap.get(item[key]) || null;
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

    return {
      message: 'Imported successfully',
      successId,
      totalRecords,
    };
  }

  async confirmImport(importId: string, userId: string) {
    const dataImport = await db.query.ImportData.findFirst({
      where: and(eq(ImportData.id, importId), eq(ImportData.user, userId)),
    });

    if (!dataImport) {
      throw new HTTPException(404, { message: 'Import record not found or access denied.' });
    }
    if (dataImport.isImported) {
      throw new HTTPException(400, { message: 'Data already imported.' });
    }

    let transactionsToInsert: InferInsertModel<typeof Transaction>[];
    try {
      if (!dataImport.data) throw new Error('Stored import data is empty.');
      transactionsToInsert = JSON.parse(dataImport.data);
      if (!Array.isArray(transactionsToInsert))
        throw new Error('Stored import data is not an array.');

      transactionsToInsert.forEach((t) => {
        t.createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
        t.updatedAt = new Date();
        t.recurrenceEndDate = t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : null;
        if (isNaN(t.createdAt.getTime())) throw new Error(`Invalid createdAt date: ${t.createdAt}`);
        if (t.recurrenceEndDate && isNaN(t.recurrenceEndDate.getTime()))
          throw new Error(`Invalid recurrenceEndDate: ${t.recurrenceEndDate}`);
      });
    } catch (e) {
      throw new HTTPException(500, {
        message: `Failed to parse stored import data: ${
          e instanceof Error ? e.message : 'Unknown parse error'
        }`,
      });
    }

    if (transactionsToInsert.length === 0) {
      await db
        .update(ImportData)
        .set({ isImported: true, updatedAt: new Date() })
        .where(eq(ImportData.id, importId));
      return { message: 'No valid transactions to import.' };
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(Transaction).values(transactionsToInsert);
        await analyticsService.handleBulkAnalytics({
          accountId: dataImport.account,
          userId: userId,
          transactions: transactionsToInsert.map((t) => ({
            amount: t.amount,
            isIncome: t.isIncome,
          })),
          tx,
        });
        await tx
          .update(ImportData)
          .set({ isImported: true, updatedAt: new Date() })
          .where(eq(ImportData.id, importId));
      });
    } catch (error: any) {
      console.error('Bulk import transaction failed:', error);
      throw new HTTPException(500, { message: `Bulk import failed: ${error.message}` });
    }

    return { message: 'Data imported successfully' };
  }

  async getSampleFileStream() {
    const filePath = path.join(process.cwd(), 'public/sample/sample_transactions.xlsx');
    try {
      const sampleFile = Bun.file(filePath);
      if (!(await sampleFile.exists())) {
        console.error(`Sample file not found at path: ${filePath}`);
        throw new HTTPException(404, { message: 'Sample file not found on server.' });
      }
      return sampleFile.stream();
    } catch (error) {
      console.error('Error accessing sample file:', error);
      if (error instanceof HTTPException) throw error;
      throw new HTTPException(500, { message: 'Could not retrieve sample file.' });
    }
  }

  async getSharedAccounts(
    userId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
    search: string,
  ) {
    const sortableFields: Record<string, SQLWrapper | SQL> = {
      name: Account.name,
      balance: Account.balance,
      createdAt: Account.createdAt,
      ownerName: User.name,
    };
    const sortField = sortableFields[sortBy] || Account.createdAt;
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    const sharedAccountIdsResult = await db
      .select({ accountId: UserAccount.accountId })
      .from(UserAccount)
      .where(eq(UserAccount.userId, userId));
    const sharedAccountIds = sharedAccountIdsResult.map((item) => item.accountId);

    if (sharedAccountIds.length === 0) {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const searchNum = Number(search);
    const isNumericSearch = !isNaN(searchNum);
    let whereClause: SQL<unknown> | undefined = inArray(Account.id, sharedAccountIds);

    if (search) {
      whereClause = and(
        whereClause,
        or(
          ilike(Account.name, `%${search}%`),
          isNumericSearch ? eq(Account.balance, searchNum) : undefined,
          ilike(Account.currency, `%${search}%`),
        ),
      );
    }

    const totalResult = await db
      .select({ count: count() })
      .from(Account)
      .leftJoin(User, eq(Account.owner, User.id))
      .where(whereClause)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });
    const total = totalResult[0]?.count ?? 0;

    const accountsData = await db
      .select({
        id: Account.id,
        name: Account.name,
        balance: Account.balance,
        createdAt: Account.createdAt,
        currency: Account.currency,
        owner: { id: User.id, name: User.name, email: User.email, profilePic: User.profilePic },
      })
      .from(Account)
      .leftJoin(User, eq(Account.owner, User.id))
      .where(whereClause)
      .orderBy(orderDirection(sortField))
      .limit(limit)
      .offset(limit * (page - 1))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
      });

    return {
      data: accountsData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPreviousShares(accountId: string, ownerId: string) {
    const account = await db.query.Account.findFirst({
      where: and(eq(Account.id, accountId), eq(Account.owner, ownerId)),
      columns: { id: true },
    });
    if (!account)
      throw new HTTPException(403, { message: "Account not found or you don't own it." });

    const sharedWithUsers = await db
      .select({
        user: { id: User.id, name: User.name, email: User.email, profilePic: User.profilePic },
      })
      .from(UserAccount)
      .innerJoin(User, eq(UserAccount.userId, User.id))
      .where(eq(UserAccount.accountId, accountId))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Fetch Shares Error: ${err.message}` });
      });

    return sharedWithUsers.map((row) => row.user);
  }

  async getImportData(importId: string, userId: string) {
    const dataImport = await db.query.ImportData.findFirst({
      where: and(eq(ImportData.id, importId), eq(ImportData.user, userId)),
    });
    if (!dataImport)
      throw new HTTPException(404, { message: 'Import data not found or access denied.' });

    try {
      if (!dataImport.data) throw new Error('Stored import data is empty.');
      const parseData = JSON.parse(dataImport.data);
      if (!Array.isArray(parseData))
        throw new Error('Stored import data is not a valid JSON array.');
      return {
        length: parseData.length,
        data: parseData,
        accountId: dataImport.account,
        totalRecords: dataImport.totalRecords,
        errorRecords: dataImport.errorRecords,
        isImported: dataImport.isImported,
        createdAt: dataImport.createdAt,
      };
    } catch (e) {
      console.error(`Failed to parse import data for ID ${importId}:`, e);
      throw new HTTPException(500, { message: 'Failed to parse stored import data.' });
    }
  }

  async getCustomAnalytics(accountId: string, userId: string, duration: string | undefined) {
    const accountAccess = await db
      .select({ id: Account.id })
      .from(Account)
      .leftJoin(UserAccount, eq(Account.id, UserAccount.accountId))
      .where(
        and(
          eq(Account.id, accountId),
          or(
            eq(Account.owner, userId),
            inArray(
              Account.id,
              db
                .select({ accountId: UserAccount.accountId })
                .from(UserAccount)
                .where(eq(UserAccount.userId, userId)),
            ),
          ),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
    if (!accountAccess)
      throw new HTTPException(404, { message: 'Account not found or access denied.' });

    const { startDate, endDate } = await getIntervalValue(duration);
    const result: any[] = await db
      .execute(
        sql.raw(`
      WITH CurrentPeriodData AS (
          SELECT
              COALESCE(SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE 0 END), 0) AS total_income,
              COALESCE(SUM(CASE WHEN "isIncome" = FALSE THEN amount ELSE 0 END), 0) AS total_expense,
              COALESCE(SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE -amount END), 0) AS total_balance
          FROM transaction
          WHERE
              account = '${accountId}'
              AND "createdAt" BETWEEN '${startDate}'::timestamp AND '${endDate}'::timestamp
      ),

      PreviousPeriodData AS (
          SELECT
              COALESCE(SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE 0 END), 0) AS prev_total_income,
              COALESCE(SUM(CASE WHEN "isIncome" = FALSE THEN amount ELSE 0 END), 0) AS prev_total_expense,
              COALESCE(SUM(CASE WHEN "isIncome" = TRUE THEN amount ELSE -amount END), 0) AS prev_total_balance
          FROM transaction
          WHERE
              account = '${accountId}'
              AND "createdAt" BETWEEN ${getSQLInterval(startDate, endDate)}::timestamp
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

    const analyticsData = result[0];

    if (!analyticsData) {
      return {
        income: 0,
        expense: 0,
        balance: 0,
        BalancePercentageChange: 0,
        IncomePercentageChange: 0,
        ExpensePercentageChange: 0,
      };
    }

    const {
      income,
      expense,
      balance,
      BalancePercentageChange,
      IncomePercentageChange,
      ExpensePercentageChange,
    } = analyticsData;

    return {
      income: Number(income),
      expense: Number(expense),
      balance: Number(balance),
      BalancePercentageChange: +Number(BalancePercentageChange).toFixed(2),
      IncomePercentageChange: +Number(IncomePercentageChange).toFixed(2),
      ExpensePercentageChange: +Number(ExpensePercentageChange).toFixed(2),
    };
  }

  async getAccountList(
    userId: string,
    page: number,
    limit: number,
    sortBy: keyof AccountInsert,
    sortOrder: string,
    search: string,
  ) {
    const sortableFields: Record<string, SQLWrapper | SQL> = {
      name: Account.name,
      balance: Account.balance,
      createdAt: Account.createdAt,
      updatedAt: Account.updatedAt,
      currency: Account.currency,
      ownerName: User.name,
    };
    const sortFieldKey = sortBy in sortableFields ? sortBy : 'createdAt';
    const sortField = sortableFields[sortFieldKey];
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    const searchNum = Number(search);
    const isNumericSearch = !isNaN(searchNum);
    const whereClause = and(
      eq(Account.owner, userId),
      search
        ? or(
            ilike(Account.name, `%${search}%`),
            isNumericSearch ? eq(Account.balance, searchNum) : undefined,
            ilike(Account.currency, `%${search}%`),
          )
        : undefined,
    );

    const totalResult = await db
      .select({ count: count() })
      .from(Account)
      .where(whereClause)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });
    const total = totalResult[0]?.count ?? 0;

    const accounts = await db
      .select({
        id: Account.id,
        name: Account.name,
        balance: Account.balance,
        createdAt: Account.createdAt,
        updatedAt: Account.updatedAt,
        currency: Account.currency,
        owner: { id: User.id, name: User.name, email: User.email, profilePic: User.profilePic },
        analytics: {
          income: Analytics.income,
          expense: Analytics.expense,
          incomePercentageChange: Analytics.incomePercentageChange,
          expensesPercentageChange: Analytics.expensesPercentageChange,
        },
      })
      .from(Account)
      .leftJoin(User, eq(Account.owner, User.id))
      .leftJoin(Analytics, eq(Analytics.account, Account.id))
      .where(whereClause)
      .orderBy(orderDirection(sortField))
      .limit(limit)
      .offset(limit * (page - 1))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
      });

    return { accounts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getAccountListSimple(userId: string) {
    return db
      .select({
        id: Account.id,
        name: Account.name,
        currency: Account.currency,
      })
      .from(Account)
      .where(eq(Account.owner, userId))
      .orderBy(asc(Account.name))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB List Error: ${err.message}` });
      });
  }

  async createAccount(userId: string, name: string, balance: number, currency: string) {
    if (!name || name.trim().length === 0)
      throw new HTTPException(400, { message: 'Account name cannot be empty.' });
    if (isNaN(Number(balance)))
      throw new HTTPException(400, { message: 'Invalid opening balance.' });
    if (!currency || currency.length !== 3)
      throw new HTTPException(400, { message: 'Invalid currency code (must be 3 letters).' });

    const openingBalance = Number(balance);

    const existingAccount = await db.query.Account.findFirst({
      where: and(eq(Account.name, name), eq(Account.owner, userId)),
    });
    if (existingAccount) {
      throw new HTTPException(409, { message: 'An account with this name already exists.' });
    }

    const result = await db.transaction(async (tx) => {
      const accountInsertResult = await tx
        .insert(Account)
        .values({
          name,
          balance: openingBalance,
          owner: userId,
          currency: currency.toUpperCase(),
          createdAt: new Date(),
        })
        .returning()
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Insert Account Error: ${err.message}` });
        });
      if (!accountInsertResult || accountInsertResult.length === 0)
        throw new HTTPException(500, { message: 'Failed to create account record.' });
      const newAccount = accountInsertResult[0];

      await tx
        .insert(Analytics)
        .values({
          account: newAccount.id,
          user: userId,
          income: openingBalance >= 0 ? openingBalance : 0,
          expense: openingBalance < 0 ? -openingBalance : 0,
          balance: openingBalance,
          previousIncome: 0,
          previousExpenses: 0,
          previousBalance: 0,
          incomePercentageChange: openingBalance > 0 ? 100 : 0,
          expensesPercentageChange: openingBalance < 0 ? 100 : 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Insert Analytics Error: ${err.message}` });
        });

      let categoryData = await tx.query.Category.findFirst({
        where: and(eq(Category.name, 'Opening Balance'), eq(Category.owner, userId)),
      });
      if (!categoryData) {
        const categoryInsertResult = await tx
          .insert(Category)
          .values({ name: 'Opening Balance', owner: userId, createdAt: new Date() })
          .returning()
          .catch((err) => {
            throw new HTTPException(500, { message: `DB Insert Category Error: ${err.message}` });
          });
        if (!categoryInsertResult || categoryInsertResult.length === 0)
          throw new HTTPException(500, { message: 'Failed to create opening balance category.' });
        categoryData = categoryInsertResult[0];
      }

      if (openingBalance !== 0) {
        await tx
          .insert(Transaction)
          .values({
            amount: Math.abs(openingBalance),
            category: categoryData.id,
            account: newAccount.id,
            text: 'Opening Balance',
            isIncome: openingBalance >= 0,
            owner: userId,
            createdBy: userId,
            updatedBy: userId,
            transfer: 'self',
            currency: newAccount.currency,
            createdAt: new Date(),
          })
          .catch((err) => {
            throw new HTTPException(500, {
              message: `DB Insert Transaction Error: ${err.message}`,
            });
          });
      }
      return newAccount;
    });
    return { message: 'Account created successfully', data: result };
  }

  async revokeShare(accountId: string, targetUserId: string, ownerId: string) {
    const account = await db.query.Account.findFirst({
      where: and(eq(Account.id, accountId), eq(Account.owner, ownerId)),
      columns: { id: true },
    });
    if (!account)
      throw new HTTPException(403, {
        message: 'Account not found or you do not own this account.',
      });

    const targetUser = await db.query.User.findFirst({
      where: eq(User.id, targetUserId),
      columns: { id: true },
    });
    if (!targetUser)
      throw new HTTPException(404, { message: 'User to revoke access from not found.' });

    const deleteResult = await db
      .delete(UserAccount)
      .where(and(eq(UserAccount.accountId, accountId), eq(UserAccount.userId, targetUserId)))
      .returning({ id: UserAccount.id })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Delete Share Error: ${err.message}` });
      });

    if (deleteResult.length === 0) {
      console.warn(
        `Attempted to revoke share, but no record found for user ${targetUserId} on account ${accountId}`,
      );
    }
    return { message: 'Access revoked successfully' };
  }

  async getAccountById(accountId: string, userId: string) {
    const accountData = await db
      .select({
        id: Account.id,
        name: Account.name,
        balance: Account.balance,
        createdAt: Account.createdAt,
        updatedAt: Account.updatedAt,
        owner: { id: User.id, name: User.name, email: User.email, profilePic: User.profilePic },
        analytics: {
          income: Analytics.income,
          expense: Analytics.expense,
          balance: Analytics.balance,
          incomePercentageChange: Analytics.incomePercentageChange,
          expensesPercentageChange: Analytics.expensesPercentageChange,
        },
        currency: Account.currency,
      })
      .from(Account)
      .leftJoin(Analytics, eq(Analytics.account, Account.id))
      .leftJoin(User, eq(User.id, Account.owner))
      .leftJoin(UserAccount, eq(UserAccount.accountId, Account.id))
      .where(
        and(
          eq(Account.id, accountId),
          or(eq(Account.owner, userId), eq(UserAccount.userId, userId)),
        ),
      )
      .groupBy(Account.id, User.id, Analytics.id)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Fetch Account Error: ${err.message}` });
      });

    if (!accountData || accountData.length === 0) {
      throw new HTTPException(404, { message: 'Account not found or access denied.' });
    }
    return accountData[0];
  }

  async updateAccount(
    accountId: string,
    userId: string,
    name: string | undefined,
    balanceInput: number | string | undefined,
    currency: string | undefined,
  ) {
    const account = await db.query.Account.findFirst({
      where: and(eq(Account.id, accountId), eq(Account.owner, userId)),
      columns: { id: true, balance: true, name: true, currency: true },
    });
    if (!account)
      throw new HTTPException(403, {
        message: "Account not found or you don't have permission to edit.",
      });

    const updateData: Partial<InferInsertModel<typeof Account>> = { updatedAt: new Date() };
    let requiresAnalyticsUpdate = false;
    let newBalance: number | undefined = undefined;

    if (name !== undefined && name.trim() !== '' && name !== account.name) {
      const existingName = await db.query.Account.findFirst({
        where: and(eq(Account.name, name), eq(Account.owner, userId), ne(Account.id, accountId)),
        columns: { id: true },
      });
      if (existingName)
        throw new HTTPException(409, {
          message: `Another account named "${name}" already exists.`,
        });
      updateData.name = name;
    }
    if (
      currency !== undefined &&
      currency.length === 3 &&
      currency.toUpperCase() !== account.currency
    ) {
      updateData.currency = currency.toUpperCase();
    }
    if (balanceInput !== undefined) {
      const parsedBalance = Number(balanceInput);
      if (isNaN(parsedBalance))
        throw new HTTPException(400, { message: 'Invalid balance amount provided.' });
      if (parsedBalance !== (account.balance ?? 0)) {
        updateData.balance = parsedBalance;
        newBalance = parsedBalance;
        requiresAnalyticsUpdate = true;
      }
    }

    if (Object.keys(updateData).length <= 1) return { message: 'No changes detected.' };

    await db.transaction(async (tx) => {
      await tx
        .update(Account)
        .set(updateData)
        .where(eq(Account.id, accountId))
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Update Account Error: ${err.message}` });
        });
      if (requiresAnalyticsUpdate && newBalance !== undefined) {
        await tx
          .update(Analytics)
          .set({ balance: newBalance, updatedAt: new Date() })
          .where(eq(Analytics.account, accountId))
          .catch((err) => {
            throw new HTTPException(500, { message: `DB Update Analytics Error: ${err.message}` });
          });
      }
    });
    return { message: 'Account updated successfully' };
  }

  async deleteAccount(accountId: string, userId: string) {
    const account = await db.query.Account.findFirst({
      where: and(eq(Account.id, accountId), eq(Account.owner, userId)),
      columns: { id: true },
    });
    if (!account)
      throw new HTTPException(403, {
        message: "Account not found or you don't have permission to delete.",
      });

    try {
      await db.transaction(async (tx) => {
        await tx.delete(UserAccount).where(eq(UserAccount.accountId, accountId));
        await tx.delete(Transaction).where(eq(Transaction.account, accountId));
        await tx.delete(Analytics).where(eq(Analytics.account, accountId));
        await tx.delete(Debts).where(eq(Debts.account, accountId));
        await tx.delete(ImportData).where(eq(ImportData.account, accountId));

        await tx.delete(Account).where(eq(Account.id, accountId));
      });
    } catch (err: any) {
      console.error(`Error deleting account ${accountId}:`, err);
      throw new HTTPException(500, { message: `Failed to delete account: ${err.message}` });
    }
    return { message: 'Account and related data deleted successfully' };
  }

  async generateStatement(
    accountId: string,
    userId: string,
    startDateStr?: string,
    endDateStr?: string,
    numTransactionsStr?: string,
    exportType?: string,
  ) {
    if (exportType !== 'pdf' && exportType !== 'xlsx') {
      throw new HTTPException(400, { message: 'Export type must be pdf or xlsx' });
    }

    const accountAccess = await db.query.Account.findFirst({
      where: and(
        eq(Account.id, accountId),
        or(
          eq(Account.owner, userId),
          inArray(
            Account.id,
            db
              .select({ accountId: UserAccount.accountId })
              .from(UserAccount)
              .where(eq(UserAccount.userId, userId)),
          ),
        ),
      ),
      columns: { id: true, name: true, currency: true },
    });
    if (!accountAccess)
      throw new HTTPException(404, { message: 'Account not found or access denied.' });

    let transactions: Array<{
      id: string;
      createdAt: Date | null;
      text: string;
      amount: number;
      isIncome: boolean;
      transfer: string | null;
      account: string;
      currency: string;
      category: { name: string | null } | null;
    }>;
    let whereClause: SQL<unknown> | undefined = eq(Transaction.account, accountId);
    let limitClause: number | undefined = undefined;
    let dateRangeString = `All Transactions`;

    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate)
        throw new HTTPException(400, { message: 'Invalid date range provided.' });
      endDate.setHours(23, 59, 59, 999);
      whereClause = and(
        whereClause,
        gt(Transaction.createdAt, startDate),
        lt(Transaction.createdAt, endDate),
      );
      dateRangeString = `${startDateStr} to ${endDateStr}`;
    } else if (numTransactionsStr) {
      const limit = parseInt(numTransactionsStr);
      if (isNaN(limit) || limit <= 0 || limit > 10000)
        throw new HTTPException(400, {
          message: 'Invalid number of transactions specified (1-10000).',
        });
      limitClause = limit;
      dateRangeString = `Last ${limit} Transactions`;
    }

    transactions = await db.query.Transaction.findMany({
      where: whereClause,
      columns: {
        id: true,
        createdAt: true,
        text: true,
        amount: true,
        isIncome: true,
        transfer: true,
        account: true,
        currency: true,
      },
      with: { category: { columns: { name: true } } },
      orderBy: desc(Transaction.createdAt),
      limit: limitClause,
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Transactions Error: ${err.message}` });
    });

    let totalIncome = 0,
      totalExpense = 0;
    transactions.forEach((t) => {
      if (t.isIncome) totalIncome += t.amount;
      else totalExpense += t.amount;
    });
    const balance = totalIncome - totalExpense;
    const incomePercentageChange = 0,
      expensePercentageChange = 0;

    const reportData = {
      accountName: accountAccess.name,
      accountCurrency: accountAccess.currency,
      transactions,
      totalIncome,
      totalExpense,
      balance,
      incomePercentageChange,
      expensePercentageChange,
      generatedAt: new Date().toLocaleString(),
      dateRange: dateRangeString,
    };

    if (exportType === 'pdf') {
      const templatePath = path.join(process.cwd(), 'public/template/statement.ejs');
      let html = await ejs.renderFile(templatePath, reportData).catch((renderError) => {
        console.error('EJS Template Rendering Error:', renderError);
        throw new HTTPException(500, {
          message: `Failed to render statement template: ${renderError.message}`,
        });
      });
      const pdfBuffer = await pdfService.generatePdfFromHtml(html, {
        format: 'A4',
        printBackground: true,
        fullPage: true,
      });
      return {
        buffer: Buffer.from(pdfBuffer), // Convert pdfBuffer,
        contentType: 'application/pdf',
        filename: 'statement.pdf',
      };
    } else {
      const transactionsSheetData = transactions.map((t) => ({
        Date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A',
        Text: t.text,
        Category: t.category?.name || 'N/A',
        Amount: t.isIncome ? t.amount : -t.amount,
        Type: t.isIncome ? 'Income' : 'Expense',
        Transfer: t.transfer || '',
        Currency: t.currency || accountAccess.currency,
      }));
      const summarySheetData = [
        { A: 'Account Name:', B: reportData.accountName },
        { A: 'Currency:', B: reportData.accountCurrency },
        { A: 'Generated At:', B: reportData.generatedAt },
        { A: 'Period:', B: reportData.dateRange },
        {},
        { A: 'Total Income:', B: reportData.totalIncome.toFixed(2) },
        { A: 'Total Expense:', B: reportData.totalExpense.toFixed(2) },
        { A: 'Net Balance:', B: reportData.balance.toFixed(2) },
        {},
        { A: 'Transactions' },
      ];
      const workbook = utils.book_new();
      const summarySheet = utils.json_to_sheet(summarySheetData, {
        header: ['A', 'B'],
        skipHeader: true,
      });
      const transactionsSheet = utils.json_to_sheet(transactionsSheetData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
      transactionsSheet['!cols'] = [
        { wch: 12 },
        { wch: 40 },
        { wch: 20 },
        { wch: 15 },
        { wch: 10 },
        { wch: 20 },
        { wch: 10 },
      ];
      utils.book_append_sheet(workbook, summarySheet, 'Summary');
      utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
      const buffer = write(workbook, { bookType: 'xlsx', type: 'buffer' });
      return {
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'statement.xlsx',
      };
    }
  }
}

export const accountService = new AccountService();
