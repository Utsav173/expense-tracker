import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { InvestmentAccount } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { investmentAccountSchema } from '../utils/schema.validations';
import { eq, count, sql } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';

const investmentAccountRouter = new Hono();

// Get all investment accounts for the user (Paginated) - Specific static route first
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

// GET Investment account summary - Specific parameterized route next
investmentAccountRouter.get('/:id/summary', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');

    const investmentAccountSummary = await db.execute(sql`
      SELECT
      ia.name as accountName,
      ia.currency,
      ia.platform,
        COALESCE(SUM(i.investedAmount), 0) as totalInvestment,
       COALESCE(SUM(i.dividend), 0) as totalDividend,
      (COALESCE(SUM(i.investedAmount), 0) + COALESCE(SUM(i.dividend), 0)) AS totalValue
        FROM investment_account ia
       JOIN investment i
       ON ia.id = i.account
       WHERE ia.id = ${accountId}
        GROUP BY ia.id
      `);

    return c.json(investmentAccountSummary.rows[0]);
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// Get single Investment Account details - General parameterized routes last
investmentAccountRouter.get('/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const investmentAccount = await db.query.InvestmentAccount.findFirst({
      where(fields, op) {
        return op.eq(fields.id, accountId);
      },
    });
    if (!investmentAccount) {
      throw new HTTPException(404, { message: 'Investment account not found' });
    }

    return c.json(investmentAccount);
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// Update an existing Investment Account - General parameterized routes last
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

// Delete Existing investment account - General parameterized routes last
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

// Create a new Investment Account - Root route
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

export default investmentAccountRouter;
