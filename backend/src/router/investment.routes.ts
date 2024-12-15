import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { Investment } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { investmentSchema } from '../utils/schema.validations';
import { eq, count } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';

const investmentRouter = new Hono();

//Get investments in accounts paged, get Investment
investmentRouter.get('/:id', authMiddleware, async (c) => {
  try {
    const investmentId = c.req.param('id');

    const { page = 1, limit = 10 } = c.req.query();

    const totalQuery = await db
      .select({ tot: count(Investment.id) })
      .from(Investment)
      .where(eq(Investment.account, investmentId))
      .then((res) => res[0].tot);
    const investments = await db.query.Investment.findMany({
      where(fields, op) {
        return op.eq(fields.account, investmentId);
      },
      limit: +limit,
      offset: +limit * (+page - 1),
    });
    return c.json({
      data: investments,
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

investmentRouter.post('/', authMiddleware, zValidator('json', investmentSchema), async (c) => {
  try {
    const { symbol, shares, purchasePrice, purchaseDate, investmentAccount } = await c.req.json();
    const newInvestment = await db
      .insert(Investment)
      .values({
        symbol: symbol,
        shares: shares,
        purchasePrice: purchasePrice,
        purchaseDate: new Date(purchaseDate),
        account: investmentAccount,
        investedAmount: purchasePrice * shares, // adding extra fields based on request
      })
      .returning();
    return c.json({ message: 'Investment  created successfully', data: newInvestment[0] });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

//  PUT - update the Investment record.

investmentRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    const { shares, purchasePrice, purchaseDate } = await c.req.json();

    await db
      .update(Investment)
      .set({ shares, purchasePrice, purchaseDate: new Date(purchaseDate) })
      .where(eq(Investment.id, invId));

    return c.json({ message: 'Investment record Updated successfully', id: invId });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

investmentRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    await db.delete(Investment).where(eq(Investment.id, invId));
    return c.json({ message: 'Investment record Deleted Successfully!' });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

export default investmentRouter;
