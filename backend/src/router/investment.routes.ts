import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { historicalPortfolioQuerySchema, investmentSchema } from '../utils/schema.validations';
import { HTTPException } from 'hono/http-exception';
import { investmentService } from '../services/investment.service';
import { Investment } from '../database/schema';
import { InferSelectModel } from 'drizzle-orm';

const investmentRouter = new Hono();

investmentRouter.get('/oldest-date', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId');
    const oldestDate = await investmentService.getOldestInvestmentDate(userId);
    return c.json({ oldestDate });
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Oldest Investment Date Error:', err);

    return c.json({ oldestDate: null }, 500);
  }
});

investmentRouter.get('/portfolio-summary', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId');
    const summary = await investmentService.getPortfolioSummary(userId);
    return c.json(summary);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Portfolio Summary Error:', err);
    throw new HTTPException(500, { message: 'Failed to calculate portfolio summary.' });
  }
});

investmentRouter.get('/stocks/search', authMiddleware, async (c) => {
  try {
    const query = c.req.query('q');
    if (!query) throw new HTTPException(400, { message: 'Search query "q" is required.' });
    const results = await investmentService.searchStocks(query);
    return c.json(results);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Stock Search Error:', err);
    throw new HTTPException(500, { message: 'Failed to search stocks.' });
  }
});

investmentRouter.get('/stocks/price/:symbol', authMiddleware, async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const priceData = await investmentService.getStockPrice(symbol);
    return c.json(priceData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error(`Stock Price Error (${c.req.param('symbol')}):`, err);
    throw new HTTPException(500, { message: 'Failed to fetch stock price.' });
  }
});

investmentRouter.get('/stocks/historical-price/:symbol', authMiddleware, async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const date = c.req.query('date');
    if (!date)
      throw new HTTPException(400, { message: 'Date query parameter is required (YYYY-MM-DD).' });
    const priceData = await investmentService.getHistoricalStockPrice(symbol, date);
    return c.json(priceData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error(`Historical Price Error (${c.req.param('symbol')}):`, err);
    throw new HTTPException(500, { message: 'Failed to fetch historical stock price.' });
  }
});

investmentRouter.get(
  '/portfolio-historical',
  authMiddleware,
  zValidator('query', historicalPortfolioQuerySchema),
  async (c) => {
    try {
      const userId = await c.get('userId');
      const { period, startDate, endDate, symbol } = c.req.valid('query');
      const result = await investmentService.getHistoricalPortfolioValue(
        userId,
        period,
        startDate,
        endDate,
        symbol,
      );
      return c.json(result);
    } catch (err: any) {
      if (err instanceof HTTPException) throw err;
      console.error('Portfolio Historical Error:', err);
      throw new HTTPException(500, { message: 'Failed to calculate historical portfolio value.' });
    }
  },
);

investmentRouter.get('/details/:id', authMiddleware, async (c) => {
  try {
    const investmentId = c.req.param('id');
    const userId = await c.get('userId');
    const investmentData = await investmentService.getInvestmentDetails(investmentId, userId);
    return c.json(investmentData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Investment Details Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch investment details.' });
  }
});

investmentRouter.put('/:id/update-dividend', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    const userId = await c.get('userId');
    const { dividend } = await c.req.json();
    if (typeof dividend !== 'number') {
      throw new HTTPException(400, { message: 'Dividend must be a number.' });
    }
    const result = await investmentService.updateInvestmentDividend(invId, userId, dividend);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Dividend Error:', err);
    throw new HTTPException(500, { message: 'Failed to update dividend.' });
  }
});

investmentRouter.get('/:accountId', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const userId = await c.get('userId');
    const { page = '1', limit = '10', sortBy = 'purchaseDate', sortOrder = 'desc' } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1)
      throw new HTTPException(400, { message: 'Invalid page number.' });
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100)
      throw new HTTPException(400, { message: 'Invalid limit value (1-100).' });
    if (sortOrder !== 'asc' && sortOrder !== 'desc')
      throw new HTTPException(400, { message: 'Invalid sort order (asc/desc).' });

    const result = await investmentService.getInvestmentsForAccount(
      accountId,
      userId,
      pageNum,
      limitNum,
      sortBy as keyof InferSelectModel<typeof Investment>,
      sortOrder as 'asc' | 'desc',
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Investments for Account Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch investments for account.' });
  }
});

investmentRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    const userId = await c.get('userId');
    const payload = await c.req.json();
    const result = await investmentService.updateInvestment(invId, userId, payload);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Investment Error:', err);
    throw new HTTPException(500, { message: 'Failed to update investment.' });
  }
});

investmentRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    const userId = await c.get('userId');
    const result = await investmentService.deleteInvestment(invId, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Investment Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete investment.' });
  }
});

investmentRouter.post('/', authMiddleware, zValidator('json', investmentSchema), async (c) => {
  try {
    const payload = await c.req.json();
    const userId = await c.get('userId');
    const result = await investmentService.createInvestment(userId, payload);
    c.status(201);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Create Investment Error:', err);
    throw new HTTPException(500, { message: 'Failed to create investment.' });
  }
});

export default investmentRouter;
