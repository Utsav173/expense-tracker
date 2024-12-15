import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { InvestmentAccount, Investment } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { investmentAccountSchema, investmentSchema } from '../utils/schema.validations';
import { eq, count } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';

const investmentAccountRouter = new Hono();
// Get investment Account

investmentAccountRouter.get('/all', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);
    const { page = 1, limit = 10 } = c.req.query();
    const totalQuery = await db
      .select({ tot: count(InvestmentAccount.id) })
      .from(InvestmentAccount)
      .where(eq(InvestmentAccount.userId, userId))
      .then((res) => res[0].tot);

    const investmentAccount = await db.query.InvestmentAccount.findMany({
      where(fields, ops) {
        return ops.eq(fields.userId, userId);
      },
      limit: +limit,
      offset: +limit * (+page - 1),
    });
    return c.json({
      data: investmentAccount,
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
// create new Investment Account

investmentAccountRouter.post(
  '/',
  authMiddleware,
  zValidator('json', investmentAccountSchema),
  async (c) => {
    try {
      const { name, platform, currency } = await c.req.json();
      const userId = await c.get('userId' as any);
      const newInvestmentAcc = await db
        .insert(InvestmentAccount)
        .values({
          name: name,
          currency: currency,
          platform: platform,
          userId: userId,
        })
        .returning();

      return c.json({
        message: 'investment Account created successfully',
        data: newInvestmentAcc[0],
      });
    } catch (err) {
      throw new HTTPException(400, {
        message: err instanceof Error ? err.message : 'something went wrong',
      });
    }
  },
);
// Edit existing investment account

investmentAccountRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const accId = c.req.param('id');
    const { name, platform } = await c.req.json();
    await db
      .update(InvestmentAccount)
      .set({
        name: name,
        platform: platform,
      })
      .where(eq(InvestmentAccount.id, accId));
    return c.json({ message: 'Investment Account updated successfully', id: accId });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// Delete Existing investment account
investmentAccountRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const accId = c.req.param('id');
    await db.delete(InvestmentAccount).where(eq(InvestmentAccount.id, accId));
    return c.json({ message: 'Investment Account deleted successfully!' });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

export default investmentAccountRouter;
