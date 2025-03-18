import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { Investment, User } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { investmentSchema } from '../utils/schema.validations';
import { eq, count, sql } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';
import { StatusCode } from 'hono/utils/http-status';

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
    const sharesValue = Number(shares);
    const purchasePriceValue = Number(purchasePrice);

    if (isNaN(sharesValue) || isNaN(purchasePriceValue)) {
      throw new HTTPException(400, { message: 'Invalid shares or purchase price' });
    }

    const newInvestment = await db
      .insert(Investment)
      .values({
        symbol: symbol,
        shares: sharesValue,
        purchasePrice: purchasePriceValue,
        purchaseDate: new Date(purchaseDate),
        account: investmentAccount,
        investedAmount: purchasePriceValue * sharesValue, // adding extra fields based on request
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
    const sharesValue = Number(shares);
    const purchasePriceValue = Number(purchasePrice);

    if (isNaN(sharesValue) || isNaN(purchasePriceValue)) {
      throw new HTTPException(400, { message: 'Invalid shares or purchase price' });
    }

    await db
      .update(Investment)
      .set({
        shares: sharesValue,
        purchasePrice: purchasePriceValue,
        purchaseDate: new Date(purchaseDate),
        investedAmount: sharesValue * purchasePriceValue,
      })
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

// GET - Get single Investment details
investmentRouter.get('/details/:id', authMiddleware, async (c) => {
  try {
    const investmentId = c.req.param('id');
    const investmentData = await db.query.Investment.findFirst({
      where(fields, op) {
        return op.eq(fields.id, investmentId);
      },
    });
    if (!investmentData) {
      throw new HTTPException(404, { message: 'Investment data not found' });
    }
    return c.json(investmentData);
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// PUT  - update investment dividend
investmentRouter.put('/:id/update-divident', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    const { dividend } = await c.req.json();
    const dividendValue = Number(dividend);

    if (isNaN(dividendValue)) {
      throw new HTTPException(400, { message: 'Invalid dividend value' });
    }

    await db.update(Investment).set({ dividend: dividendValue }).where(eq(Investment.id, invId));

    return c.json({ message: 'Investment record Updated successfully', id: invId });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});
//GET all investment data for portfolio
investmentRouter.get('/portfolio', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);

    const portfolioData = await db.execute(sql`
      SELECT 
        ia.name as accountName,
        ia.currency,
         SUM(i.investedAmount) as totalInvestment,
        COALESCE(SUM(i.dividend), 0) as totalDividend,
        SUM(i.shares) as totalShares
        FROM investment_account ia
       JOIN investment i
       ON ia.id = i.account
       WHERE ia.userId = ${userId}
      GROUP BY ia.id
    `);

    return c.json(portfolioData);
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'something went wrong',
    });
  }
});

// GET /stocks/search?q=symbol - Search for stocks by symbol
investmentRouter.get('/stocks/search', authMiddleware, async (c) => {
  try {
    const symbol = c.req.query('q');
    if (!symbol) {
      throw new HTTPException(400, { message: 'Symbol is required' });
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        symbol,
      )}&quotesCount=10&lang=en-US`,
    );

    if (!response.ok) {
      throw new HTTPException(response.status as StatusCode, {
        message: 'Could not fetch the stock data',
      });
    }

    const data = await response.json();

    // Transform Yahoo's response to match your expected format
    const formattedData = data.quotes.map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.longname || quote.shortname,
      exchange: quote.exchange,
      type: quote.quoteType,
    }));

    return c.json(formattedData);
  } catch (err) {
    console.error('Search error:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});

// GET /stocks/price/:symbol - Get stock price
investmentRouter.get('/stocks/price/:symbol', authMiddleware, async (c) => {
  try {
    const { symbol } = c.req.param();
    if (!symbol) {
      throw new HTTPException(400, { message: 'Symbol is required' });
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol,
      )}?interval=1m&range=1d`,
    );

    if (!response.ok) {
      throw new HTTPException(response.status as StatusCode, {
        message: 'Could not fetch the stock data',
      });
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]) {
      throw new HTTPException(404, { message: 'Stock not found' });
    }

    const result = data.chart.result[0];
    const lastPrice = result.meta?.regularMarketPrice;
    const previousClose = result.meta?.previousClose;

    let change = null;
    let changePercent = null;

    if (lastPrice != null && previousClose != null) {
      change = lastPrice - previousClose;
      changePercent = previousClose === 0 ? null : (change / previousClose) * 100;
    }

    return c.json({
      symbol: symbol,
      price: lastPrice,
      change: Number(change),
      changePercent: Number(changePercent),
      exchange: result.meta?.exchangeName,
      currency: result.meta?.currency,
      companyName: result.meta?.longName, // Added company name
      fiftyTwoWeekHigh: result.meta?.fiftyTwoWeekHigh, // Added 52 week high
      fiftyTwoWeekLow: result.meta?.fiftyTwoWeekLow, // Added 52 week low
      regularMarketDayHigh: result.meta?.regularMarketDayHigh, // Added day high
      regularMarketDayLow: result.meta?.regularMarketDayLow, // Added day low
      regularMarketVolume: result.meta?.regularMarketVolume, // Added volume
    });
  } catch (err) {
    console.error('Price fetch error:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});
export default investmentRouter;
