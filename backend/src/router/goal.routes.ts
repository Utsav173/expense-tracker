import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { SavingGoal } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { savingGoalSchema } from '../utils/schema.validations';
import { eq, count, sql, asc, desc, InferSelectModel } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';
import { parseISO } from 'date-fns';

const goalRouter = new Hono();

// GET / - Get a list of goals
goalRouter.get('/all', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = c.req.query();

    const allowedSortFields: (keyof InferSelectModel<typeof SavingGoal>)[] = [
      'id',
      'createdAt',
      'updatedAt',
      'name',
      'targetAmount',
      'savedAmount',
      'targetDate',
    ];
    const validSortBy = allowedSortFields.includes(
      sortBy as keyof InferSelectModel<typeof SavingGoal>,
    )
      ? (sortBy as keyof InferSelectModel<typeof SavingGoal>)
      : 'createdAt';

    const sortColumn = SavingGoal[validSortBy];
    if (!sortColumn) {
      throw new HTTPException(400, { message: 'Invalid sort field specified.' });
    }

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? asc : desc;
    const orderByClause = sortDirection(sortColumn);

    const totalQuery = await db
      .select({ tot: count(SavingGoal.id) })
      .from(SavingGoal)
      .where(eq(SavingGoal.userId, userId))
      .then((res) => res[0]?.tot ?? 0)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    const savingGoals = await db.query.SavingGoal.findMany({
      where(fields, ops) {
        return ops.eq(fields.userId, userId);
      },
      limit: +limit,
      offset: +limit * (+page - 1),
      orderBy: [orderByClause],
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    return c.json({
      data: savingGoals,
      pagination: {
        total: totalQuery,
        totalPages: Math.ceil(totalQuery / +limit),
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error fetching goals:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// POST - create new goal for a month
goalRouter.post('/', authMiddleware, zValidator('json', savingGoalSchema), async (c) => {
  try {
    const { name, targetAmount, targetDate } = await c.req.json();
    const userId = await c.get('userId' as any);
    const newSavingGoal = await db
      .insert(SavingGoal)
      .values({
        userId: userId,
        targetAmount: targetAmount,
        name: name,
        targetDate: parseISO(targetDate),
      })
      .returning();

    return c.json({ message: 'saving goal created successfully', data: newSavingGoal[0] });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// PUT - edit goal
goalRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const goalId = c.req.param('id');
    const { targetAmount, targetDate, savedAmount } = await c.req.json();

    await db
      .update(SavingGoal)
      .set({ targetAmount, targetDate: parseISO(targetDate), savedAmount: savedAmount })
      .where(eq(SavingGoal.id, goalId));
    return c.json({ message: 'Goal updated successfully!', id: goalId });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// PUT /goals/:id/add-amount - Add an amount towards a saving goal
goalRouter.put('/:id/add-amount', authMiddleware, async (c) => {
  try {
    const goalId = c.req.param('id');
    const { amount } = await c.req.json();

    await db
      .update(SavingGoal)
      .set({ savedAmount: sql`${SavingGoal.savedAmount} + ${amount}` })
      .where(eq(SavingGoal.id, goalId));
    return c.json({ message: 'Goal updated successfully!', id: goalId });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// PUT /goals/:id/withdraw-amount - Withdraw an amount from a saving goal
goalRouter.put('/:id/withdraw-amount', authMiddleware, async (c) => {
  try {
    const goalId = c.req.param('id');
    const { amount } = await c.req.json();

    await db
      .update(SavingGoal)
      .set({ savedAmount: sql`${SavingGoal.savedAmount} - ${amount}` })
      .where(eq(SavingGoal.id, goalId));
    return c.json({ message: 'Goal updated successfully!', id: goalId });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// DELETE - Delete a goal
goalRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await db.delete(SavingGoal).where(eq(SavingGoal.id, id));
    return c.json({ message: 'Saving Goal Deleted successfully!' });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

export default goalRouter;
