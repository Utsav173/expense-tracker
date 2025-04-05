import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { Budget } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { budgetSchema } from '../utils/schema.validations';
import { eq, count, asc, desc, sql, and, sum, InferSelectModel } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';

const budgetRouter = new Hono();

// GET - get a budget for logged user with given filter (pagination included)
budgetRouter.get('/:id/all', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = c.req.query();
    const userId = await c.get('userId' as any);

    if (id !== 'all' && id !== userId) {
      throw new HTTPException(401, { message: 'Unauthorised operation' });
    }

    const allowedSortFields: (keyof InferSelectModel<typeof Budget>)[] = [
      'id',
      'createdAt',
      'updatedAt',
      'month',
      'year',
      'amount',
      'category',
    ];

    const validSortBy = allowedSortFields.includes(sortBy as keyof InferSelectModel<typeof Budget>)
      ? (sortBy as keyof InferSelectModel<typeof Budget>)
      : 'createdAt';

    const sortColumn = Budget[validSortBy];
    if (!sortColumn) {
      throw new HTTPException(400, { message: 'Invalid sort field specified for budgets.' });
    }

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? asc : desc;
    const orderByClause = sortDirection(sortColumn);

    let whereClause = eq(Budget.userId, id === 'all' ? userId : id);

    const totalQuery = await db
      .select({ tot: count(Budget.id) })
      .from(Budget)
      .where(whereClause)
      .then((res) => res[0]?.tot ?? 0)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    const budgetData = await db.query.Budget.findMany({
      where: whereClause,
      limit: +limit,
      offset: +limit * (+page - 1),
      with: {
        category: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [orderByClause],
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    return c.json({
      data: budgetData,
      pagination: {
        total: totalQuery,
        totalPages: Math.ceil(totalQuery / +limit),
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error fetching budgets:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// POST - create new budget for a month
budgetRouter.post('/', authMiddleware, zValidator('json', budgetSchema), async (c) => {
  try {
    const { categoryId, amount, month, year } = await c.req.json();
    const userId = await c.get('userId' as any);

    if (isNaN(Number(amount))) {
      throw new HTTPException(400, { message: 'Invalid amount' });
    }

    const newBudget = await db
      .insert(Budget)
      .values({
        amount: Number(amount),
        month: month,
        year: year,
        userId: userId,
        category: categoryId,
      })
      .returning();
    return c.json({ message: 'Budget created successfully', data: newBudget[0] });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});
// PUT - edit budget

budgetRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const budgetId = c.req.param('id');
    const { amount } = await c.req.json();

    if (isNaN(Number(amount))) {
      throw new HTTPException(400, { message: 'Invalid amount' });
    }
    await db
      .update(Budget)
      .set({ amount: Number(amount) })
      .where(eq(Budget.id, budgetId));
    return c.json({ message: 'budget updated successfully!', id: budgetId });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// DELETE - Delete a budget
budgetRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await db.delete(Budget).where(eq(Budget.id, id));
    return c.json({ message: 'Budget Deleted successfully!' });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// GET budget summary for user over specified duration
budgetRouter.get('/summary', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);
    const { month, year } = c.req.query();

    const monthValue = Number(month);
    const yearValue = Number(year);

    if (isNaN(monthValue) || monthValue < 1 || monthValue > 12 || isNaN(yearValue)) {
      throw new HTTPException(400, { message: 'Invalid month or year' });
    }

    const result = await db
      .execute(
        sql`
        SELECT
            b.category,
            c.name as categoryName, -- Renamed to avoid conflict
            b.amount as budgetedAmount,
            COALESCE(SUM(t.amount), 0) as actualSpend
        FROM
           budget b
        LEFT JOIN
          transaction t
          ON b.category = t.category
             AND EXTRACT(MONTH FROM t."createdAt") = ${monthValue}
             AND EXTRACT(YEAR FROM t."createdAt") = ${yearValue}
             AND t."isIncome" = false -- Only sum expenses for spending
             AND t.owner = ${userId} -- Ensure transaction owner matches
        JOIN
            category c ON b.category = c.id
        WHERE
            b."userId" = ${userId} AND b.month = ${monthValue} AND b.year = ${yearValue}
         GROUP BY
              b.category, c.name, b.amount
        ORDER BY
               b.amount DESC
    `,
      )
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    // Map to ensure correct types and structure
    const summaryData = result.rows.map((row: any) => ({
      category: row.category,
      categoryName: row.categoryname, // Access lowercase name
      budgetedAmount: Number(row.budgetedamount || 0),
      actualSpend: Number(row.actualspend || 0),
    }));

    return c.json(summaryData);
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Budget summary error:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

budgetRouter.get('/:id/progress', authMiddleware, async (c) => {
  const budgetId = c.req.param('id');
  const userId = await c.get('userId' as any);
  try {
    const budget = await db.query.Budget.findFirst({
      where: and(eq(Budget.id, budgetId), eq(Budget.userId, userId)),
    });

    if (!budget) {
      throw new HTTPException(404, { message: 'Budget not found' });
    }

    const totalSpentResult = await db
      .execute(
        sql`
          SELECT COALESCE(SUM(t.amount), 0) AS total
          FROM transaction t
          WHERE t.category = ${budget.category}
            AND EXTRACT(MONTH FROM t."createdAt") = ${budget.month}
            AND EXTRACT(YEAR FROM t."createdAt") = ${budget.year}
            AND t."isIncome" = false -- Only sum expenses
            AND t.owner = ${userId}; 
      `,
      )
      .then((res) => res.rows[0] as { total: number | string })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error getting spending: ${err.message}` });
      });

    const totalSpentValue = Number(totalSpentResult?.total ?? 0);
    const budgetedAmount = Number(budget.amount || 0);
    const remainingAmount = budgetedAmount - totalSpentValue;
    const progress =
      budgetedAmount > 0 ? Math.max(0, Math.min((totalSpentValue / budgetedAmount) * 100, 100)) : 0;

    return c.json({
      budgetId: budget.id,
      budgetedAmount: budgetedAmount,
      totalSpent: totalSpentValue,
      remainingAmount: remainingAmount,
      progress: +progress.toFixed(2),
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Budget progress error:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});

export default budgetRouter;
