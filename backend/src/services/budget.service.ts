import { db } from '../database';
import { Budget, Category, Transaction } from '../database/schema';
import {
  InferInsertModel,
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  sql,
  sum,
  AnyColumn,
  InferSelectModel,
  ilike,
} from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { endOfMonth, format, getMonth, getYear } from 'date-fns';
import { getIntervalValue } from '../utils/date.utils';

export class BudgetService {
  async getBudgets(
    userId: string,
    page: number,
    limit: number,
    sortBy: keyof InferSelectModel<typeof Budget>,
    sortOrder: 'asc' | 'desc',
  ) {
    const sortColumn = Budget[sortBy] || Budget.createdAt; // Default sort
    const orderByClause =
      sortOrder === 'asc' ? asc(sortColumn as AnyColumn) : desc(sortColumn as AnyColumn);

    const totalResult = await db
      .select({ count: count() })
      .from(Budget)
      .where(eq(Budget.userId, userId))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });

    const total = totalResult[0]?.count ?? 0;

    const budgetData = await db.query.Budget.findMany({
      where: eq(Budget.userId, userId),
      limit: limit,
      offset: limit * (page - 1),
      with: {
        category: { columns: { id: true, name: true } }, // Include category name
      },
      orderBy: [orderByClause],
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
    });

    return {
      data: budgetData,
      pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
    };
  }

  async createBudget(
    userId: string,
    payload: Pick<InferInsertModel<typeof Budget>, 'category' | 'amount' | 'month' | 'year'>,
  ) {
    const categoryId = (payload as any).categoryId ?? payload.category;

    const { amount, month, year } = payload;

    if (isNaN(Number(amount)) || amount < 0) {
      throw new HTTPException(400, { message: 'Invalid budget amount.' });
    }
    if (month < 1 || month > 12 || year < 1900 || year > 2100) {
      // Basic validation
      throw new HTTPException(400, { message: 'Invalid month or year.' });
    }

    // Check if category exists and belongs to user or is shared
    const validCategory = await db.query.Category.findFirst({
      where: and(eq(Category.id, categoryId), eq(Category.owner, userId)),
      columns: { id: true },
    });

    if (!validCategory) {
      throw new HTTPException(404, { message: 'Category not found or access denied.' });
    }

    // Check if a budget for this category, month, and year already exists
    const existingBudget = await db.query.Budget.findFirst({
      where: and(
        eq(Budget.userId, userId),
        eq(Budget.category, categoryId),
        eq(Budget.month, month),
        eq(Budget.year, year),
      ),
      columns: { id: true },
    });

    if (existingBudget) {
      throw new HTTPException(409, {
        message: `Budget already exists for this category in ${month}/${year}.`,
      });
    }

    const newBudget = await db
      .insert(Budget)
      .values({
        userId: userId,
        category: categoryId,
        amount: Number(amount),
        month: month,
        year: year,
        createdAt: new Date(),
      })
      .returning()
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Insert Error: ${err.message}` });
      });

    if (!newBudget || newBudget.length === 0) {
      throw new HTTPException(500, { message: 'Failed to create budget record.' });
    }

    return newBudget[0];
  }

  async updateBudget(budgetId: string, userId: string, amount: number) {
    if (isNaN(Number(amount)) || amount < 0) {
      throw new HTTPException(400, { message: 'Invalid amount.' });
    }

    // Verify the user owns the budget
    const existingBudget = await db.query.Budget.findFirst({
      where: and(eq(Budget.id, budgetId), eq(Budget.userId, userId)),
      columns: { id: true },
    });

    if (!existingBudget) {
      throw new HTTPException(404, {
        message: "Budget not found or you don't have permission to edit.",
      });
    }

    const result = await db
      .update(Budget)
      .set({ amount: Number(amount), updatedAt: new Date() })
      .where(eq(Budget.id, budgetId))
      .returning({ id: Budget.id })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Update Error: ${err.message}` });
      });

    if (result.length === 0) {
      throw new HTTPException(500, { message: 'Failed to update budget.' });
    }

    return { message: 'Budget updated successfully!', id: budgetId };
  }

  async deleteBudget(budgetId: string, userId: string) {
    // Verify the user owns the budget
    const existingBudget = await db.query.Budget.findFirst({
      where: and(eq(Budget.id, budgetId), eq(Budget.userId, userId)),
      columns: { id: true },
    });

    if (!existingBudget) {
      throw new HTTPException(404, {
        message: "Budget not found or you don't have permission to delete.",
      });
    }

    const result = await db
      .delete(Budget)
      .where(eq(Budget.id, budgetId))
      .returning({ id: Budget.id })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Delete Error: ${err.message}` });
      });

    if (result.length === 0) {
      throw new HTTPException(500, { message: 'Failed to delete budget.' });
    }

    return { message: 'Budget Deleted successfully!' };
  }

  async getBudgetSummary(
    userId: string,
    queryParams: {
      duration?: string;
      month?: string;
      year?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const {
      duration = 'thisMonth',
      month: specificMonth,
      year: specificYear,
      startDate: customStartDate,
      endDate: customEndDate,
    } = queryParams;

    let startDateStr: string;
    let endDateStr: string;
    let filterClause: SQL;

    // Determine date range based on query params
    if (specificMonth && specificYear) {
      const monthNum = parseInt(specificMonth);
      const yearNum = parseInt(specificYear);
      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        throw new HTTPException(400, { message: 'Invalid month or year provided.' });
      }
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = endOfMonth(firstDay);
      startDateStr = format(firstDay, 'yyyy-MM-dd 00:00:00.000');
      endDateStr = format(lastDay, 'yyyy-MM-dd 23:59:59.999');
      // Filter budgets specifically for this month/year
      filterClause = sql`b.month = ${monthNum} AND b.year = ${yearNum}`;
    } else {
      // Use duration or custom range for filtering transactions, but fetch ALL budgets for the user
      const range = await getIntervalValue(
        duration === 'custom' && customStartDate && customEndDate
          ? `${customStartDate},${customEndDate}`
          : duration,
      );
      startDateStr = range.startDate;
      endDateStr = range.endDate;
      // Fetch all budgets for the user if no specific month/year is given
      filterClause = sql`b."userId" = ${userId}`;
    }

    // SQL query to join Budget, Category, and aggregate Transactions
    const result = await db
      .execute(
        sql`
        SELECT
            b.category,
            c.name as categoryName,
            b.amount as budgetedAmount,
            COALESCE(SUM(t.amount), 0) as actualSpend
        FROM
           budget b
        LEFT JOIN
          transaction t
          ON b.category = t.category
             AND t."createdAt" BETWEEN ${startDateStr}::timestamp AND ${endDateStr}::timestamp -- Filter transactions by calculated date range
             AND t."isIncome" = false
             AND t.owner = ${userId}
        JOIN
            category c ON b.category = c.id
        WHERE
            ${filterClause} -- Filter budgets based on month/year or just userId
            AND b."userId" = ${userId} -- Ensure user owns the budget record
        GROUP BY
            b.category, c.name, b.amount
        ORDER BY
            b.amount DESC
        `,
      )
      .catch((err) => {
        console.error('Error fetching budget summary:', err);
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    const summaryData = result.rows.map((row: any) => ({
      category: row.category,
      categoryName: row.categoryname,
      budgetedAmount: Number(row.budgetedamount || 0),
      actualSpend: Number(row.actualspend || 0),
    }));

    return summaryData;
  }

  async getBudgetProgress(budgetId: string, userId: string) {
    const budget = await db.query.Budget.findFirst({
      where: and(eq(Budget.id, budgetId), eq(Budget.userId, userId)),
      with: { category: { columns: { name: true, id: true } } },
    });

    if (!budget) {
      throw new HTTPException(404, { message: 'Budget not found or access denied.' });
    }

    const budgetStartDate = new Date(budget.year, budget.month - 1, 1);
    const budgetEndDate = endOfMonth(budgetStartDate);

    const totalSpentResult = await db
      .select({ total: sum(Transaction.amount) })
      .from(Transaction)
      .where(
        and(
          eq(Transaction.category, budget.category.id),
          eq(Transaction.owner, userId),
          eq(Transaction.isIncome, false),
          sql`"createdAt" >= ${format(budgetStartDate, 'yyyy-MM-dd 00:00:00.000')}`,
          sql`"createdAt" <= ${format(budgetEndDate, 'yyyy-MM-dd 23:59:59.999')}`,
        ),
      )
      .then((res) => res[0] ?? { total: '0' })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Spending Error: ${err.message}` });
      });

    const totalSpentValue = Number(totalSpentResult.total ?? 0);
    const budgetedAmount = Number(budget.amount || 0);
    const remainingAmount = budgetedAmount - totalSpentValue;
    const progress =
      budgetedAmount > 0
        ? Math.max(0, Math.min((totalSpentValue / budgetedAmount) * 100, 100))
        : totalSpentValue > 0
        ? 100
        : 0;

    return {
      budgetId: budget.id,
      categoryName: budget.category.name, // Use joined name
      budgetedAmount: budgetedAmount,
      totalSpent: totalSpentValue,
      remainingAmount: parseFloat(remainingAmount.toFixed(2)),
      progress: parseFloat(progress.toFixed(2)),
    };
  }

  async getBudgetProgressByName(userId: string, categoryName: string) {
    const now = new Date();
    const currentMonth = getMonth(now) + 1;
    const currentYear = getYear(now);

    // Find the category ID first
    const category = await db.query.Category.findFirst({
      where: and(ilike(Category.name, categoryName), eq(Category.owner, userId)),
      columns: { id: true, name: true },
    });

    if (!category) {
      throw new HTTPException(404, { message: `Category "${categoryName}" not found.` });
    }

    // Find the budget for this category and current month/year
    const budget = await db.query.Budget.findFirst({
      where: and(
        eq(Budget.userId, userId),
        eq(Budget.category, category.id),
        eq(Budget.month, currentMonth),
        eq(Budget.year, currentYear),
      ),
      columns: { id: true, amount: true, month: true, year: true }, // Include needed fields
    });

    if (!budget) {
      throw new HTTPException(404, {
        message: `No budget found for "${categoryName}" in ${format(now, 'MMMM yyyy')}.`,
      });
    }

    // Reuse existing progress logic
    return this.getBudgetProgress(budget.id, userId);
  }
}

export const budgetService = new BudgetService();
