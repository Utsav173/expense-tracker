import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { savingGoalSchema } from '../utils/schema.validations';
import { HTTPException } from 'hono/http-exception';
import { goalService } from '../services/goal.service';
import { SavingGoal } from '../database/schema';
import { InferSelectModel } from 'drizzle-orm';

const goalRouter = new Hono();

goalRouter.get('/all', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId');
    const { page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1)
      throw new HTTPException(400, { message: 'Invalid page number.' });
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100)
      throw new HTTPException(400, { message: 'Invalid limit value (1-100).' });
    if (sortOrder !== 'asc' && sortOrder !== 'desc')
      throw new HTTPException(400, { message: 'Invalid sort order (asc/desc).' });

    const result = await goalService.getGoals(
      userId,
      pageNum,
      limitNum,
      sortBy as keyof InferSelectModel<typeof SavingGoal>,
      sortOrder as 'asc' | 'desc',
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Goals Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch saving goals.' });
  }
});

goalRouter.post('/', authMiddleware, zValidator('json', savingGoalSchema), async (c) => {
  try {
    const payload = await c.req.json();
    const userId = await c.get('userId');
    const newGoal = await goalService.createGoal(userId, payload);
    c.status(201);
    return c.json({ message: 'Saving goal created successfully', data: newGoal });
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Create Goal Error:', err);
    throw new HTTPException(500, { message: 'Failed to create saving goal.' });
  }
});

goalRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const goalId = c.req.param('id');
    const payload = await c.req.json();
    const userId = await c.get('userId');
    const result = await goalService.updateGoal(goalId, userId, payload);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Goal Error:', err);
    throw new HTTPException(500, { message: 'Failed to update saving goal.' });
  }
});

goalRouter.put('/:id/add-amount', authMiddleware, async (c) => {
  try {
    const goalId = c.req.param('id');
    const { amount } = await c.req.json();
    const userId = await c.get('userId');
    if (typeof amount !== 'number') {
      throw new HTTPException(400, { message: 'Amount must be a number.' });
    }
    const result = await goalService.addAmountToGoal(goalId, userId, amount);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Add Amount to Goal Error:', err);
    throw new HTTPException(500, { message: 'Failed to add amount to saving goal.' });
  }
});

goalRouter.put('/:id/withdraw-amount', authMiddleware, async (c) => {
  try {
    const goalId = c.req.param('id');
    const { amount } = await c.req.json();
    const userId = await c.get('userId');
    if (typeof amount !== 'number') {
      throw new HTTPException(400, { message: 'Amount must be a number.' });
    }
    const result = await goalService.withdrawAmountFromGoal(goalId, userId, amount);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Withdraw Amount from Goal Error:', err);
    throw new HTTPException(500, { message: 'Failed to withdraw amount from saving goal.' });
  }
});

goalRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = await c.get('userId');
    const result = await goalService.deleteGoal(id, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Goal Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete saving goal.' });
  }
});

export default goalRouter;
