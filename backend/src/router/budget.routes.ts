import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { Budget, Category } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { budgetSchema } from '../utils/schema.validations';
import { eq, count, asc, desc } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';

const budgetRouter = new Hono();

// GET - get a budget for logged user with given filter (pagination included)
budgetRouter.get('/:id/all', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { page = 1, limit = 10 } = c.req.query();
    const userId = await c.get('userId' as any);

    if (id !== 'all' && id !== userId) {
      throw new HTTPException(401, { message: 'Unauthorised operation' });
    }

    let totalQuery;
    let budgetData;

    if (id === 'all') {
      totalQuery = await db
        .select({ tot: count(Budget.id) })
        .from(Budget)
        .where(eq(Budget.userId, userId))
        .then((res) => res[0].tot);

      budgetData = await db.query.Budget.findMany({
        where(fields, ops) {
          return ops.eq(fields.userId, userId);
        },
        limit: +limit,
        offset: +limit * (+page - 1),
        with: {
          category: true,
        },
      });
    } else {
      totalQuery = await db
        .select({ tot: count(Budget.id) })
        .from(Budget)
        .where(eq(Budget.userId, id))
        .then((res) => res[0].tot);

      budgetData = await db.query.Budget.findMany({
        where(fields, ops) {
          return ops.eq(fields.userId, id);
        },
        limit: +limit,
        offset: +limit * (+page - 1),
        with: {
          category: true,
        },
      });
    }

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
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});
// POST - create new budget for a month
budgetRouter.post('/', authMiddleware, zValidator('json', budgetSchema), async (c) => {
  try {
    const { categoryId, amount, month, year } = await c.req.json();
    const userId = await c.get('userId' as any);
    const newBudget = await db
      .insert(Budget)
      .values({
        amount: amount,
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
    await db.update(Budget).set({ amount: amount }).where(eq(Budget.id, budgetId));
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

export default budgetRouter;
