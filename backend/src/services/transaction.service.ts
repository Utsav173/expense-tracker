import { db } from '../database';
import { Account, Category, Transaction, User } from '../database/schema';
import {
  InferInsertModel,
  InferSelectModel,
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  SQLWrapper,
  max,
  min,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { HTTPException } from 'hono/http-exception';
import { parseNaturalLanguageDateRange, formatDateRangeForQuery } from '../utils/nl_date.utils';
import {
  getDateTruncate,
  getOrderBy,
  getDateFormatting,
  getIntervalValue,
} from '../utils/date.utils';
import { analyticsService } from './analytics.service';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { utils as xlsxUtils, write as xlsxWrite } from 'xlsx';

type TransactionFilters = {
  duration?: string; // Natural language or YYYY-MM-DD,YYYY-MM-DD
  q?: string;
  isIncome?: string;
  categoryId?: string;
  accountId?: string;
  userId?: string;
  minAmount?: number; // Added minAmount
  maxAmount?: number; // Added maxAmount
  startDate?: Date;
  endDate?: Date;
};

type TransactionSelect = InferSelectModel<typeof Transaction> & {
  category: { id: string | null; name: string | null } | null;
  createdBy: { id: string; name: string; email: string; profilePic: string | null } | null;
  updatedBy: {
    id: string | null;
    name: string | null;
    email: string | null;
    profilePic: string | null;
  } | null;
};

export class TransactionService {
  // Updated to handle amount filters
  private getFilterConditions(filters: TransactionFilters): SQL<unknown> | undefined {
    const { q, isIncome, categoryId, startDate, endDate, accountId, userId, minAmount, maxAmount } =
      filters;

    let baseQuery: SQL<unknown> | undefined;
    if (accountId) {
      baseQuery = eq(Transaction.account, accountId);
    } else if (userId) {
      baseQuery = eq(Transaction.owner, userId);
    } else {
      throw new Error('Either accountId or userId must be provided for filtering transactions');
    }

    const searchTermCondition =
      q && q.length > 0
        ? or(
            ilike(Transaction.text, `%${q}%`),
            ilike(Transaction.transfer, `%${q}%`),
            !isNaN(Number(q)) ? eq(Transaction.amount, Number(q)) : undefined,
            ilike(Category.name, `%${q}%`),
          )
        : undefined;

    const dateCondition =
      startDate && endDate
        ? and(
            gte(Transaction.createdAt, startDate), // Use gte for start date
            lte(Transaction.createdAt, endDate), // Use lte for end date
          )
        : undefined;

    const incomeCondition =
      isIncome !== undefined ? eq(Transaction.isIncome, isIncome === 'true') : undefined;
    const categoryCondition = categoryId ? eq(Transaction.category, categoryId) : undefined;

    // Add amount range conditions
    const minAmountCondition =
      minAmount !== undefined ? gte(Transaction.amount, minAmount) : undefined;
    const maxAmountCondition =
      maxAmount !== undefined ? lte(Transaction.amount, maxAmount) : undefined;

    const conditions = [
      baseQuery,
      dateCondition,
      searchTermCondition,
      incomeCondition,
      categoryCondition,
      minAmountCondition,
      maxAmountCondition,
    ].filter((c) => c !== undefined);

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async getTransactions(
    filters: TransactionFilters,
    page: number,
    pageSize: number,
    sortBy: string,
    sortOrder: string,
  ) {
    // Use new date parser
    const dateRange = await getIntervalValue(filters.duration);

    const filterConditions = this.getFilterConditions({
      ...filters,
      startDate: new Date(dateRange?.startDate),
      endDate: new Date(dateRange?.endDate),
    });

    const UpdatedBy = alias(User, 'UpdatedBy');
    const validSortFields: Record<string, SQLWrapper | SQL> = {
      createdAt: Transaction.createdAt,
      amount: Transaction.amount,
      text: Transaction.text,
      categoryName: Category.name,
      createdByName: User.name,
      updatedByName: UpdatedBy.name,
    };
    const finalSortByField = validSortFields[sortBy] || Transaction.createdAt;
    const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? asc : desc;

    const totalCountResult = await db
      .select({ count: count() })
      .from(Transaction)
      .leftJoin(Category, eq(Category.id, Transaction.category))
      .leftJoin(User, eq(User.id, Transaction.createdBy))
      .leftJoin(UpdatedBy, eq(UpdatedBy.id, Transaction.updatedBy))
      .where(filterConditions)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });
    const totalCount = totalCountResult[0]?.count ?? 0;

    const transactionData = await db
      .select({
        id: Transaction.id,
        amount: Transaction.amount,
        category: { id: Category.id, name: Category.name },
        text: Transaction.text,
        isIncome: Transaction.isIncome,
        account: Transaction.account,
        transfer: Transaction.transfer,
        createdAt: Transaction.createdAt,
        createdBy: { id: User.id, name: User.name, email: User.email, profilePic: User.profilePic },
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
      .where(filterConditions)
      .limit(pageSize)
      .offset(pageSize * (page - 1))
      .orderBy(finalSortOrder(finalSortByField))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
      });

    const dateRangeResult = await db
      .select({
        minDate: sql<string | null>`MIN(${Transaction.createdAt})`,
        maxDate: sql<string | null>`MAX(${Transaction.createdAt})`,
      })
      .from(Transaction)
      .where(
        filters.accountId
          ? eq(Transaction.account, filters.accountId)
          : eq(Transaction.owner, filters.userId!),
      )
      .catch((err) => {
        console.error('Date Range Fetch Error:', err);
        return [{ minDate: null, maxDate: null }];
      });
    const dateRangeInfo = dateRangeResult[0] ?? { minDate: null, maxDate: null };

    return {
      transactions: transactionData,
      pagination: {
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize,
      },
      filters: {
        isIncome: filters.isIncome === undefined ? undefined : filters.isIncome === 'true',
        categoryId: filters.categoryId,
        sortBy,
        sortOrder: finalSortOrder === asc ? 'asc' : 'desc',
        duration: filters.duration,
        q: filters.q,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
      },
      dateRange: { minDate: dateRangeInfo.minDate, maxDate: dateRangeInfo.maxDate },
    };
  }

  async getTransactionById(id: string, userId: string): Promise<TransactionSelect> {
    const UpdatedBy = alias(User, 'UpdatedBy');
    const transactionData = await db
      .select({
        id: Transaction.id,
        amount: Transaction.amount,
        category: { id: Category.id, name: Category.name },
        text: Transaction.text,
        isIncome: Transaction.isIncome,
        account: Transaction.account,
        transfer: Transaction.transfer,
        createdAt: Transaction.createdAt,
        createdBy: { id: User.id, name: User.name, email: User.email, profilePic: User.profilePic },
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
      .where(and(eq(Transaction.id, id), eq(Transaction.owner, userId)))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
      });

    if (!transactionData || transactionData.length === 0) {
      throw new HTTPException(404, { message: 'Transaction not found or access denied.' });
    }
    return transactionData[0] as TransactionSelect;
  }

  async createTransaction(
    userId: string,
    payload: InferInsertModel<typeof Transaction>,
    // --- ADDED Optional Parameter ---
    _internal_bypassOwnerCheck: boolean = false,
    // ------------------------------
  ) {
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
      createdAt,
    } = payload;
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount))
      throw new HTTPException(400, { message: 'Invalid transaction amount.' });

    // --- MODIFIED Account Check ---
    const accountWhereClause = _internal_bypassOwnerCheck
      ? eq(Account.id, account) // Internal call: Just check if account exists
      : and(eq(Account.id, account), eq(Account.owner, userId)); // User call: Check ownership

    const validAccount = await db.query.Account.findFirst({
      where: accountWhereClause,
      columns: { id: true, balance: true, currency: true, owner: true }, // Fetch owner always
    });

    // Throw 404 if account doesn't exist at all (for internal calls)
    if (!validAccount && _internal_bypassOwnerCheck) {
      throw new HTTPException(404, {
        message: `Account ${account} not found during internal transaction creation.`,
      });
    }
    // Throw 403 if account doesn't exist OR user doesn't own it (for user calls)
    if (!validAccount && !_internal_bypassOwnerCheck) {
      throw new HTTPException(403, { message: 'Account not found or access denied.' });
    }
    // -----------------------------

    // Check balance only for user-initiated expenses
    if (!_internal_bypassOwnerCheck && !isIncome && (validAccount!.balance ?? 0) < parsedAmount)
      throw new HTTPException(400, { message: 'Insufficient balance for this expense.' });

    // Use the actual owner from the fetched account data, especially for internal calls
    const actualOwnerId = validAccount!.owner;

    if (category) {
      // Category check should still ensure the category owner is the transaction owner
      const validCategory = await db.query.Category.findFirst({
        where: and(eq(Category.id, category), eq(Category.owner, actualOwnerId)),
        columns: { id: true },
      });
      if (!validCategory) throw new HTTPException(400, { message: 'Invalid category selected.' });
    }

    let parsedEndDate: Date | null = null;
    if (recurring === true) {
      if (!recurrenceType)
        throw new HTTPException(400, {
          message: 'Recurrence type is required for recurring transactions.',
        });
      if (recurrenceEndDate) {
        parsedEndDate =
          recurrenceEndDate instanceof Date ? recurrenceEndDate : new Date(recurrenceEndDate);
        if (isNaN(parsedEndDate.getTime()))
          throw new HTTPException(400, { message: 'Invalid recurrence end date format.' });
      }
    }

    const transactionResult = await db.transaction(async (tx) => {
      const newTransaction = await tx
        .insert(Transaction)
        .values({
          text,
          amount: parsedAmount,
          isIncome,
          transfer,
          category,
          account: validAccount!.id, // Use validated account ID
          owner: actualOwnerId, // Use actual owner ID
          createdBy: userId, // Log who initiated (user or system via template owner)
          updatedBy: userId,
          recurring: recurring ?? false,
          recurrenceType: recurring ? recurrenceType : null,
          recurrenceEndDate: parsedEndDate,
          currency: currency ?? validAccount!.currency ?? 'INR', // Use account currency
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        })
        .returning()
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Insert Error: ${err.message}` });
        });
      if (!newTransaction || newTransaction.length === 0)
        throw new HTTPException(500, { message: 'Failed to create transaction record.' });

      // Analytics update still uses the actual owner ID
      await analyticsService.handleAnalyticsUpdate({
        account: validAccount!.id,
        user: actualOwnerId, // Use actual owner for analytics context
        isIncome,
        amount: parsedAmount,
        tx,
      });
      return newTransaction[0];
    });
    return { message: 'Transaction created successfully', data: transactionResult };
  }

  async updateTransaction(
    transactionId: string,
    userId: string,
    payload: Partial<InferInsertModel<typeof Transaction>>,
  ) {
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
    } = payload;

    const validTransaction = await db.query.Transaction.findFirst({
      where: and(eq(Transaction.id, transactionId), eq(Transaction.owner, userId)),
    });
    if (!validTransaction)
      throw new HTTPException(404, { message: 'Transaction not found or access denied.' });

    const updateData: Partial<InferInsertModel<typeof Transaction>> = {
      updatedBy: userId,
      updatedAt: new Date(),
    };
    if (text !== undefined) updateData.text = text;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (isIncome !== undefined) updateData.isIncome = isIncome;
    if (transfer !== undefined) updateData.transfer = transfer;
    if (category !== undefined) updateData.category = category;
    if (createdAt !== undefined) updateData.createdAt = new Date(createdAt!);
    if (recurring !== undefined) updateData.recurring = recurring;
    if (currency !== undefined) updateData.currency = currency;

    if (updateData.amount !== undefined && isNaN(updateData.amount))
      throw new HTTPException(400, { message: 'Invalid transaction amount.' });

    if (
      updateData.recurring === true ||
      (updateData.recurring === undefined && validTransaction.recurring)
    ) {
      if (recurrenceType !== undefined) updateData.recurrenceType = recurrenceType;
      if (recurrenceEndDate !== undefined) {
        if (recurrenceEndDate === null) updateData.recurrenceEndDate = null;
        else {
          const parsedEndDate =
            recurrenceEndDate instanceof Date ? recurrenceEndDate : new Date(recurrenceEndDate);
          if (isNaN(parsedEndDate.getTime()))
            throw new HTTPException(400, { message: 'Invalid recurrence end date format.' });
          updateData.recurrenceEndDate = parsedEndDate;
        }
      }
      if (
        (updateData.recurring === true || validTransaction.recurring) &&
        updateData.recurrenceType === undefined &&
        !validTransaction.recurrenceType
      ) {
        throw new HTTPException(400, {
          message: 'Recurrence type is required when transaction is recurring.',
        });
      }
    } else if (updateData.recurring === false) {
      updateData.recurrenceType = null;
      updateData.recurrenceEndDate = null;
    }

    if (updateData.category && updateData.category !== validTransaction.category) {
      const validCategory = await db.query.Category.findFirst({
        where: and(eq(Category.id, updateData.category), eq(Category.owner, userId)),
      });
      if (!validCategory)
        throw new HTTPException(400, { message: 'Invalid category selected for update.' });
    }

    const originalAmount = validTransaction.amount;
    const newAmount = updateData.amount ?? originalAmount;
    const originalIsIncome = validTransaction.isIncome;
    const newIsIncome = updateData.isIncome ?? originalIsIncome;
    let balanceChange = 0,
      incomeChange = 0,
      expenseChange = 0,
      requiresBalanceUpdate = false;

    if (newAmount !== originalAmount || newIsIncome !== originalIsIncome) {
      requiresBalanceUpdate = true;
      const originalEffect = originalIsIncome ? originalAmount : -originalAmount;
      const newEffect = newIsIncome ? newAmount : -newAmount;
      balanceChange = newEffect - originalEffect;
      if (originalIsIncome) incomeChange -= originalAmount;
      else expenseChange -= originalAmount;
      if (newIsIncome) incomeChange += newAmount;
      else expenseChange += newAmount;

      const account = await db.query.Account.findFirst({
        where: eq(Account.id, validTransaction.account!),
        columns: { balance: true },
      });
      if (!account)
        throw new HTTPException(404, { message: 'Account associated with transaction not found.' });
      const finalAccountBalance = (account.balance ?? 0) + balanceChange;
      if (finalAccountBalance < 0 && !newIsIncome)
        throw new HTTPException(400, { message: 'Insufficient balance after update.' });
    }

    if (Object.keys(updateData).length <= 2)
      return { message: 'No changes detected.', data: validTransaction };

    const transactionResult = await db.transaction(async (tx) => {
      const updatedTransaction = await tx
        .update(Transaction)
        .set(updateData)
        .where(eq(Transaction.id, transactionId))
        .returning()
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Update Transaction Error: ${err.message}` });
        });
      if (updatedTransaction.length === 0)
        throw new HTTPException(500, { message: 'Failed to update transaction.' });

      if (requiresBalanceUpdate) {
        await tx
          .update(Account)
          .set({ balance: sql`${Account.balance} + ${balanceChange}`, updatedAt: new Date() })
          .where(eq(Account.id, validTransaction.account!))
          .catch((err) => {
            throw new HTTPException(500, { message: `DB Update Account Error: ${err.message}` });
          });
        await analyticsService.updateAnalyticsForTransactionChange({
          accountId: validTransaction.account!,
          incomeChange,
          expenseChange,
          balanceChange,
          tx,
        });
      }
      return updatedTransaction[0];
    });
    return { message: 'Transaction updated successfully', data: transactionResult };
  }

  async deleteTransaction(transactionId: string, userId: string) {
    const transaction = await db.query.Transaction.findFirst({
      where: and(eq(Transaction.id, transactionId), eq(Transaction.owner, userId)),
      columns: { id: true, account: true, amount: true, isIncome: true },
    });
    if (!transaction)
      throw new HTTPException(404, { message: 'Transaction not found or access denied.' });

    const amount = transaction.amount;
    const isIncome = transaction.isIncome;
    const accountId = transaction.account!;

    const result = await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(Transaction)
        .where(eq(Transaction.id, transactionId))
        .returning({ id: Transaction.id })
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Delete Transaction Error: ${err.message}` });
        });
      if (deleted.length === 0)
        throw new HTTPException(404, { message: 'Transaction not found during delete operation.' });

      const balanceChange = isIncome ? -amount : amount;
      await tx
        .update(Account)
        .set({ balance: sql`${Account.balance} + ${balanceChange}`, updatedAt: new Date() })
        .where(eq(Account.id, accountId))
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Update Account Error: ${err.message}` });
        });

      const incomeChange = isIncome ? -amount : 0;
      const expenseChange = !isIncome ? -amount : 0;
      await analyticsService.updateAnalyticsForTransactionChange({
        accountId,
        incomeChange,
        expenseChange,
        balanceChange,
        tx,
      });
      return deleted[0];
    });
    return { message: 'Transaction deleted successfully', id: result.id };
  }

  // --- Chart and Specific View Methods --- (Implement logic here)

  async getCategoryChartData(userId: string, accountId?: string, duration?: string) {
    const { startDate, endDate } = await getIntervalValue(duration);

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
          ${accountId ? sql`AND t.account = ${accountId}` : sql``}
        GROUP BY
          c.name
      ) AS subquery;
      `,
      )
      .then((res) => res.rows)
      .catch((err) => {
        throw new HTTPException(500, { message: err.message });
      });

    return result[0] ?? { name: [], totalIncome: [], totalExpense: [] };
  }

  async getIncomeExpenseTotals(userId: string, accountId?: string, duration?: string) {
    const dateRange = duration ? parseNaturalLanguageDateRange(duration) : null;
    const { startDate, endDate } = dateRange
      ? formatDateRangeForQuery(dateRange)
      : { startDate: undefined, endDate: undefined };

    let whereClause = and(
      eq(Transaction.owner, userId),
      startDate ? gte(Transaction.createdAt, new Date(startDate)) : undefined,
      endDate ? lte(Transaction.createdAt, new Date(endDate)) : undefined,
    );
    if (accountId) {
      whereClause = and(whereClause, eq(Transaction.account, accountId));
    }

    const result = await db
      .select({
        income:
          sql<number>`COALESCE(SUM(CASE WHEN ${Transaction.isIncome} = TRUE THEN ${Transaction.amount} ELSE 0 END), 0)`.mapWith(
            Number,
          ),
        expense:
          sql<number>`COALESCE(SUM(CASE WHEN ${Transaction.isIncome} = FALSE THEN ${Transaction.amount} ELSE 0 END), 0)`.mapWith(
            Number,
          ),
      })
      .from(Transaction)
      .where(whereClause)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Income/Expense Total Error: ${err.message}` });
      });

    return result[0] ?? { income: 0, expense: 0 };
  }

  async getIncomeExpenseChartData(userId: string, accountId?: string, duration?: string) {
    const { startDate, endDate } = duration
      ? await getIntervalValue(duration)
      : { startDate: undefined, endDate: undefined };

    if (!startDate || !endDate) {
      // Handle case where date range couldn't be parsed - maybe default or throw?
      throw new HTTPException(400, { message: 'Invalid or missing date range for chart.' });
    }

    const dateTruncate = getDateTruncate(duration);

    // This query generates aggregated income, expense and balance data
    // for a given duration, accountId or userId
    const result = await db
      .execute(
        sql.raw(`
      SELECT 
        json_agg(${getDateFormatting(duration)}) AS "date",
        json_agg(total_income) AS "income",
        json_agg(total_expense) AS "expense",
        json_agg(balance) AS "balance"
      FROM (
        SELECT
          ${dateTruncate} AS date,
          SUM(CASE WHEN "isIncome" THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN NOT "isIncome" THEN amount ELSE 0 END) AS total_expense,
          SUM(CASE WHEN "isIncome" THEN amount ELSE -amount END) AS balance
        FROM "transaction"
        WHERE "createdAt" BETWEEN '${startDate}' AND '${endDate}'
          AND ${accountId ? `account = '${accountId}'` : `owner = '${userId}'`}
        GROUP BY date
        ORDER BY ${getOrderBy(dateTruncate)}
      ) AS subquery`),
      )
      .then((result) => {
        return result.rows[0];
      })
      .catch((err) => {
        throw new HTTPException(500, { message: err.message });
      });

    // Ensure arrays exist even if query returns null/undefined for them
    return result;
  }

  // --- Recurring Transaction Specific Methods ---

  async getRecurringTransactions(userId: string, page: number, pageSize: number) {
    const whereClause = and(eq(Transaction.owner, userId), eq(Transaction.recurring, true));

    const totalResult = await db
      .select({ count: count() })
      .from(Transaction)
      .where(whereClause)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });
    const total = totalResult[0]?.count ?? 0;

    const transactions = await db.query.Transaction.findMany({
      where: whereClause,
      limit: pageSize,
      offset: pageSize * (page - 1),
      orderBy: desc(Transaction.createdAt),
      with: { category: { columns: { id: true, name: true } } },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
    });

    return {
      transactions,
      pagination: { total, totalPages: Math.ceil(total / pageSize), currentPage: page, pageSize },
    };
  }

  async getRecurringTransactionById(transactionId: string, userId: string) {
    const transaction = await db.query.Transaction.findFirst({
      where: and(
        eq(Transaction.id, transactionId),
        eq(Transaction.owner, userId),
        eq(Transaction.recurring, true),
      ),
      with: { category: { columns: { id: true, name: true } } },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
    });

    if (!transaction)
      throw new HTTPException(404, {
        message: 'Recurring transaction not found or access denied.',
      });
    return transaction;
  }

  async skipNextRecurringOccurrence(transactionId: string, userId: string) {
    // Placeholder implementation - Actual skipping needs external logic
    const updated = await db
      .update(Transaction)
      .set({ updatedAt: new Date() }) // Just touch the record
      .where(
        and(
          eq(Transaction.id, transactionId),
          eq(Transaction.owner, userId),
          eq(Transaction.recurring, true),
        ),
      )
      .returning({ id: Transaction.id });

    if (updated.length === 0) {
      throw new HTTPException(404, {
        message: 'Recurring transaction not found or access denied.',
      });
    }

    // console.warn("Skipping recurring transaction logic is not fully implemented. Placeholder update performed.");
    return { message: 'Recurring transaction skip noted (placeholder action).' };
  }

  async exportTransactions(
    filters: TransactionFilters,
    formatType: 'xlsx' | 'csv' = 'xlsx', // Rename format to formatType
  ): Promise<{ data: Buffer | string; filename: string; contentType: string }> {
    const dateRange = filters.duration ? await getIntervalValue(filters.duration) : null;
    const filterConditions = this.getFilterConditions({
      ...filters,
      startDate: dateRange?.startDate ? new Date(dateRange.startDate) : undefined,
      endDate: dateRange?.endDate ? new Date(dateRange.endDate) : undefined,
    });

    const transactions = await db.query.Transaction.findMany({
      where: filterConditions,
      columns: {
        createdAt: true,
        text: true,
        amount: true,
        isIncome: true,
        transfer: true,
        currency: true,
      },
      with: {
        category: { columns: { name: true } },
        account: { columns: { name: true } },
      },
      orderBy: desc(Transaction.createdAt),
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error for Export: ${err.message}` });
    });

    if (!transactions.length) {
      throw new HTTPException(404, {
        message: 'No transactions found matching the specified criteria.',
      });
    }

    const exportData = transactions.map((tx) => ({
      Date: tx.createdAt ? format(tx.createdAt, 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      Description: tx.text,
      Amount: tx.isIncome ? tx.amount : -tx.amount,
      Type: tx.isIncome ? 'Income' : 'Expense',
      Category: tx.category?.name ?? 'Uncategorized',
      Account: tx.account?.name ?? 'N/A',
      Currency: tx.currency,
      Transfer: tx.transfer ?? '',
    }));

    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    let fileData: Buffer | string;
    let filename: string;
    let contentType: string;

    if (formatType === 'xlsx') {
      // Use formatType
      const ws = xlsxUtils.json_to_sheet(exportData);
      const wb = xlsxUtils.book_new();
      xlsxUtils.book_append_sheet(wb, ws, 'Transactions');
      fileData = xlsxWrite(wb, { type: 'buffer', bookType: 'xlsx' });
      filename = `transactions_${timestamp}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      // csv
      fileData = Papa.unparse(exportData);
      filename = `transactions_${timestamp}.csv`;
      contentType = 'text/csv';
    }

    return { data: fileData, filename, contentType };
  }

  async getExtremeTransaction(
    userId: string,
    type: 'highest_income' | 'lowest_income' | 'highest_expense' | 'lowest_expense',
    duration?: string,
    accountId?: string,
  ) {
    const { startDate, endDate } = duration
      ? await getIntervalValue(duration)
      : { startDate: undefined, endDate: undefined };

    let whereClause: SQL<unknown> | undefined = eq(Transaction.owner, userId);
    if (accountId) {
      whereClause = and(whereClause, eq(Transaction.account, accountId));
    }
    if (startDate && endDate) {
      whereClause = and(
        whereClause,
        gte(Transaction.createdAt, new Date(startDate)),
        lte(Transaction.createdAt, new Date(endDate)),
      );
    }

    let isIncomeFilter: boolean;
    let orderByClause: SQL<unknown>;
    let amountSelection: SQL<number>;

    switch (type) {
      case 'highest_income':
        isIncomeFilter = true;
        orderByClause = desc(Transaction.amount);
        amountSelection = max(Transaction.amount).mapWith(Number);
        break;
      case 'lowest_income':
        isIncomeFilter = true;
        orderByClause = asc(Transaction.amount);
        amountSelection = min(Transaction.amount).mapWith(Number);
        break;
      case 'highest_expense':
        isIncomeFilter = false;
        orderByClause = desc(Transaction.amount);
        amountSelection = max(Transaction.amount).mapWith(Number);
        break;
      case 'lowest_expense':
        isIncomeFilter = false;
        orderByClause = asc(Transaction.amount);
        amountSelection = min(Transaction.amount).mapWith(Number);
        break;
    }

    whereClause = and(whereClause, eq(Transaction.isIncome, isIncomeFilter));

    const extremeAmountResult = await db
      .select({ amount: amountSelection })
      .from(Transaction)
      .where(whereClause)
      .then((res) => res[0]?.amount);

    if (extremeAmountResult === null || extremeAmountResult === undefined) {
      return null;
    }

    const extremeTransaction = await db.query.Transaction.findFirst({
      where: and(whereClause, eq(Transaction.amount, extremeAmountResult)),
      orderBy: [orderByClause, desc(Transaction.createdAt)],
      with: {
        category: { columns: { name: true } },
        account: { columns: { name: true, currency: true } },
      },
    });

    return extremeTransaction;
  }
}

export const transactionService = new TransactionService();
