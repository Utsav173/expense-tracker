import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { investmentAccountSchema } from '../utils/schema.validations';
import { HTTPException } from 'hono/http-exception';
import { investmentAccountService } from '../services/investmentAccount.service';
import { InvestmentAccount } from '../database/schema';
import { InferSelectModel } from 'drizzle-orm';

const investmentAccountRouter = new Hono();

investmentAccountRouter.get('/all', authMiddleware, async (c) => {
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

    const result = await investmentAccountService.getInvestmentAccounts(
      userId,
      pageNum,
      limitNum,
      sortBy as keyof InferSelectModel<typeof InvestmentAccount>,
      sortOrder as 'asc' | 'desc',
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Investment Accounts Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch investment accounts.' });
  }
});

investmentAccountRouter.get('/:id/summary', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = await c.get('userId');
    const summaryData = await investmentAccountService.getInvestmentAccountSummary(
      accountId,
      userId,
    );
    return c.json(summaryData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Investment Account Summary Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch investment account summary.' });
  }
});

investmentAccountRouter.get('/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = await c.get('userId');
    const investmentAccount = await investmentAccountService.getInvestmentAccountById(
      accountId,
      userId,
    );
    return c.json(investmentAccount);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Investment Account By ID Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch investment account details.' });
  }
});

investmentAccountRouter.post(
  '/',
  authMiddleware,
  zValidator('json', investmentAccountSchema),
  async (c) => {
    try {
      const payload = await c.req.json();
      const userId = await c.get('userId');
      const newAccount = await investmentAccountService.createInvestmentAccount(userId, payload);
      c.status(201);
      return c.json({ message: 'Investment account created successfully', data: newAccount });
    } catch (err: any) {
      if (err instanceof HTTPException) throw err;
      console.error('Create Investment Account Error:', err);
      throw new HTTPException(500, { message: 'Failed to create investment account.' });
    }
  },
);

investmentAccountRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const payload = await c.req.json();
    const userId = await c.get('userId');
    const result = await investmentAccountService.updateInvestmentAccount(
      accountId,
      userId,
      payload,
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Investment Account Error:', err);
    throw new HTTPException(500, { message: 'Failed to update investment account.' });
  }
});

investmentAccountRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = await c.get('userId');
    const result = await investmentAccountService.deleteInvestmentAccount(accountId, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Investment Account Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete investment account.' });
  }
});

investmentAccountRouter.get('/:id/performance', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = await c.get('userId');
    const performanceData = await investmentAccountService.getInvestmentAccountPerformance(
      accountId,
      userId,
    );
    return c.json(performanceData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Investment Account Performance Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch investment account performance.' });
  }
});

export default investmentAccountRouter;
