import { Hono } from 'hono';
import { debtSchema, interestSchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';
import authMiddleware from '../middleware';
import { HTTPException } from 'hono/http-exception';
import { debtService } from '../services/debt.service';

const interestRouter = new Hono();

interestRouter.post('/calculate', zValidator('json', interestSchema), async (c) => {
  try {
    const { amount, percentage, type, duration, compoundingFrequency, frequency } =
      await c.req.json();
    const result = debtService.calculateInterest(
      amount,
      percentage,
      duration,
      type,
      compoundingFrequency,
      frequency,
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Interest Calculation Error:', err);
    throw new HTTPException(500, { message: 'Failed to calculate interest.' });
  }
});

interestRouter.get('/debts/:id/schedule', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = await c.get('userId');
    const schedule = await debtService.getDebtAmortizationSchedule(id, userId);
    return c.json(schedule);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Debt Schedule Error:', err);
    throw new HTTPException(500, { message: 'Failed to generate debt schedule.' });
  }
});

interestRouter.post('/debts', authMiddleware, zValidator('json', debtSchema), async (c) => {
  try {
    const payload = await c.req.json();
    const ownerId = await c.get('userId');
    const newDebt = await debtService.createDebt(ownerId, payload);
    c.status(201);
    return c.json({ message: 'Debt created successfully', data: newDebt });
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Create Debt Error:', err);
    throw new HTTPException(500, { message: 'Failed to create debt.' });
  }
});

interestRouter.get('/debts', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId');
    const {
      duration,
      q,
      type,
      page = '1',
      pageSize = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isPaid,
    } = c.req.query();

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    if (isNaN(pageNum) || pageNum < 1)
      throw new HTTPException(400, { message: 'Invalid page number.' });
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100)
      throw new HTTPException(400, { message: 'Invalid page size (1-100).' });
    if (sortOrder !== 'asc' && sortOrder !== 'desc')
      throw new HTTPException(400, { message: 'Invalid sort order (asc/desc).' });
    if (type && type !== 'given' && type !== 'taken')
      throw new HTTPException(400, { message: 'Invalid type filter (given/taken).' });

    const filters = {
      duration,
      q,
      type: type as 'given' | 'taken' | undefined,
      isPaid: isPaid as 'true' | 'false' | undefined,
    };
    const result = await debtService.getDebts(
      userId,
      filters,
      pageNum,
      pageSizeNum,
      sortBy,
      sortOrder,
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Debts Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch debts.' });
  }
});

interestRouter.put('/debts/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const payload = await c.req.json();
    const userId = await c.get('userId');
    const result = await debtService.updateDebt(id, userId, payload);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Debt Error:', err);
    throw new HTTPException(500, { message: 'Failed to update debt.' });
  }
});

interestRouter.delete('/debts/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = await c.get('userId');
    const result = await debtService.deleteDebt(id, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Debt Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete debt.' });
  }
});

interestRouter.put('/debts/:id/mark-paid', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = await c.get('userId');
    const result = await debtService.markDebtAsPaid(id, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Mark Debt Paid Error:', err);
    throw new HTTPException(500, { message: 'Failed to mark debt as paid.' });
  }
});

export default interestRouter;
