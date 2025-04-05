import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { InvestmentAccount } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { investmentAccountSchema } from '../utils/schema.validations';
import { eq, count, sql, and, InferSelectModel, asc, desc } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';

const investmentAccountRouter = new Hono();

// Get all investment accounts for the user (Paginated) - Specific static route first
investmentAccountRouter.get('/all', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = c.req.query();

    const allowedSortFields: (keyof InferSelectModel<typeof InvestmentAccount>)[] = [
      'id',
      'createdAt',
      'updatedAt',
      'name',
      'platform',
      'balance',
      'currency',
    ];
    const validSortBy = allowedSortFields.includes(
      sortBy as keyof InferSelectModel<typeof InvestmentAccount>,
    )
      ? (sortBy as keyof InferSelectModel<typeof InvestmentAccount>)
      : 'createdAt';

    const sortColumn = InvestmentAccount[validSortBy];
    if (!sortColumn) {
      throw new HTTPException(400, {
        message: 'Invalid sort field specified for investment accounts.',
      });
    }

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? asc : desc;
    const orderByClause = sortDirection(sortColumn);

    const totalQuery = await db
      .select({ tot: count(InvestmentAccount.id) })
      .from(InvestmentAccount)
      .where(eq(InvestmentAccount.userId, userId))
      .then((res) => res[0]?.tot ?? 0)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    const investmentAccounts = await db.query.InvestmentAccount.findMany({
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
      data: investmentAccounts,
      pagination: {
        total: totalQuery,
        totalPages: Math.ceil(totalQuery / +limit),
        page: +page,
        limit: +limit,
      },
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error fetching investment accounts:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// GET Investment account summary - Specific parameterized route next
investmentAccountRouter.get('/:id/summary', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = await c.get('userId' as any);

    const accountCheck = await db.query.InvestmentAccount.findFirst({
      where: and(eq(InvestmentAccount.id, accountId), eq(InvestmentAccount.userId, userId)),
      columns: { id: true, name: true, currency: true, platform: true },
    });

    if (!accountCheck) {
      throw new HTTPException(404, { message: 'Investment account not found or access denied.' });
    }

    const investmentAccountSummaryResult = await db.execute(sql`
      SELECT
          ia.name as accountname,
          ia.currency,
          ia.platform,
          COALESCE(SUM(i."investedAmount"), 0) as totalinvestment, 
          COALESCE(SUM(i.dividend), 0) as totaldividend, 
          -- Calculate total value based on actual investment amount + dividend
          (COALESCE(SUM(i."investedAmount"), 0) + COALESCE(SUM(i.dividend), 0)) AS totalvalue 
      FROM investment_account ia
      LEFT JOIN investment i ON ia.id = i.account
      WHERE ia.id = ${accountId}
      GROUP BY ia.id, ia.name, ia.currency, ia.platform
    `);

    const summaryData = investmentAccountSummaryResult.rows[0];

    if (!summaryData) {
      return c.json({
        accountname: accountCheck.name,
        currency: accountCheck.currency,
        platform: accountCheck.platform,
        totalinvestment: 0,
        totaldividend: 0,
        totalvalue: 0,
      });
    }

    return c.json({
      accountname: summaryData.accountname,
      currency: summaryData.currency,
      platform: summaryData.platform,
      totalinvestment: Number(summaryData.totalinvestment || 0),
      totaldividend: Number(summaryData.totaldividend || 0),
      totalvalue: Number(summaryData.totalvalue || 0),
    });
  } catch (err) {
    console.error('Error fetching investment summary:', err);

    if (err instanceof HTTPException) {
      throw err;
    }

    throw new HTTPException(500, {
      message: 'Something went wrong fetching the investment summary.',
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
