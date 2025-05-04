import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { budgetSchema } from '../utils/schema.validations';
import { HTTPException } from 'hono/http-exception';
import { budgetService } from '../services/budget.service';
import { Budget } from '../database/schema';
import { InferSelectModel } from 'drizzle-orm';

const budgetRouter = new Hono();

budgetRouter.get('/:id/all', authMiddleware, async (c) => {
  try {
    const requestedId = c.req.param('id');
    const { page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = c.req.query();
    const userId = await c.get('userId');

    if (requestedId !== 'all' && requestedId !== userId) {
      throw new HTTPException(403, { message: 'Forbidden: You can only access your own budgets.' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1)
      throw new HTTPException(400, { message: 'Invalid page number.' });
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100)
      throw new HTTPException(400, { message: 'Invalid limit value (1-100).' });
    if (sortOrder !== 'asc' && sortOrder !== 'desc')
      throw new HTTPException(400, { message: 'Invalid sort order (asc/desc).' });

    const result = await budgetService.getBudgets(
      userId,
      pageNum,
      limitNum,
      sortBy as keyof InferSelectModel<typeof Budget>,
      sortOrder as 'asc' | 'desc',
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Budgets Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch budgets.' });
  }
});

budgetRouter.post('/', authMiddleware, zValidator('json', budgetSchema), async (c) => {
  try {
    const payload = await c.req.json();
    const userId = await c.get('userId');
    const newBudget = await budgetService.createBudget(userId, payload);
    c.status(201);
    return c.json({ message: 'Budget created successfully', data: newBudget });
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Create Budget Error:', err);
    throw new HTTPException(500, { message: 'Failed to create budget.' });
  }
});

budgetRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const budgetId = c.req.param('id');
    const { amount } = await c.req.json();
    const userId = await c.get('userId');
    const result = await budgetService.updateBudget(budgetId, userId, amount);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Budget Error:', err);
    throw new HTTPException(500, { message: 'Failed to update budget.' });
  }
});

budgetRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = await c.get('userId');
    const result = await budgetService.deleteBudget(id, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Budget Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete budget.' });
  }
});

budgetRouter.get('/summary', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId');

    const queryParams = c.req.query();
    const summaryData = await budgetService.getBudgetSummary(userId, queryParams);
    return c.json(summaryData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Budget Summary Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch budget summary.' });
  }
});

budgetRouter.get('/:id/progress', authMiddleware, async (c) => {
  try {
    const budgetId = c.req.param('id');
    const userId = await c.get('userId');
    const progressData = await budgetService.getBudgetProgress(budgetId, userId);
    return c.json(progressData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Budget Progress Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch budget progress.' });
  }
});

export default budgetRouter;
