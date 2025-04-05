import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { Investment, InvestmentAccount, User } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { investmentSchema } from '../utils/schema.validations';
import { eq, count, sql, and, inArray, desc, InferSelectModel, asc } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';
import { StatusCode } from 'hono/utils/http-status';
import { PromisePool } from '@supercharge/promise-pool';

const investmentRouter = new Hono();

investmentRouter.get('/portfolio', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);

    const portfolioData = await db
      .select({
        accountName: InvestmentAccount.name,
        currency: InvestmentAccount.currency,
        totalInvestment: sql<number>`sum(${Investment.investedAmount})`.mapWith(Number),
        totalDividend: sql<number>`coalesce(sum(${Investment.dividend}), 0)`.mapWith(Number),
        totalShares: sql<number>`coalesce(sum(${Investment.shares}), 0)`.mapWith(Number),
      })
      .from(InvestmentAccount)
      .leftJoin(Investment, eq(InvestmentAccount.id, Investment.account))
      .where(eq(InvestmentAccount.userId, userId))
      .groupBy(InvestmentAccount.id, InvestmentAccount.name, InvestmentAccount.currency)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    return c.json(portfolioData);
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error fetching portfolio:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong fetching portfolio',
    });
  }
});

investmentRouter.get('/portfolio-summary', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);

    const userPrefs = await db.query.User.findFirst({
      where: eq(User.id, userId),
      columns: { preferredCurrency: true },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });
    const preferredCurrency = userPrefs?.preferredCurrency || 'USD';

    const accounts = await db.query.InvestmentAccount.findMany({
      where: eq(InvestmentAccount.userId, userId),
      columns: { id: true, currency: true },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    if (!accounts.length) {
      return c.json({
        totalInvestedAmount: 0,
        currentMarketValue: 0,
        totalDividends: 0,
        overallGainLoss: 0,
        overallGainLossPercentage: 0,
        numberOfAccounts: 0,
        numberOfHoldings: 0,
        currency: preferredCurrency,
        valueIsEstimate: false,
      });
    }

    const accountIds = accounts.map((acc) => acc.id);

    const investments = await db.query.Investment.findMany({
      where: inArray(Investment.account, accountIds),
      with: {
        account: {
          columns: { currency: true },
        },
      },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    if (!investments.length) {
      return c.json({
        totalInvestedAmount: 0,
        currentMarketValue: 0,
        totalDividends: 0,
        overallGainLoss: 0,
        overallGainLossPercentage: 0,
        numberOfAccounts: accounts.length,
        numberOfHoldings: 0,
        currency: preferredCurrency,
        valueIsEstimate: false,
      });
    }

    const uniqueSymbols = Array.from(new Set(investments.map((inv) => inv.symbol)));
    const priceMap = new Map<string, { price: number | null; currency: string | null }>();

    const { results, errors: poolErrors } = await PromisePool.for(uniqueSymbols)
      .withConcurrency(5)
      .handleError(async (error, symbol) => {
        console.error(`PromisePool: Failed to fetch price for ${symbol}:`, error);
      })
      .process(async (symbol) => {
        try {
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
              symbol,
            )}?interval=1m&range=1d`,
          );
          if (!response.ok) return { symbol, price: null, currency: null };
          const data = await response.json();
          const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
          const stockCurrency = data.chart?.result?.[0]?.meta?.currency;
          return {
            symbol,
            price: typeof price === 'number' ? price : null,
            currency: typeof stockCurrency === 'string' ? stockCurrency : null,
          };
        } catch (e) {
          console.error(`Fetch Exception for ${symbol}:`, e);
          return { symbol, price: null, currency: null };
        }
      });

    results.forEach((result) => {
      if (
        result &&
        typeof result === 'object' &&
        'symbol' in result &&
        'price' in result &&
        'currency' in result
      ) {
        priceMap.set(result.symbol, { price: result.price, currency: result.currency });
      } else {
        console.warn('Received unexpected result from PromisePool:', result);
      }
    });

    if (poolErrors.length > 0) {
      console.warn(`Encountered ${poolErrors.length} errors during parallel price fetching.`);
    }

    let totalInvestedAmount = 0;
    let estimatedCurrentMarketValue = 0;
    let totalDividends = 0;
    let valueIsEstimate = false;

    const encounteredCurrencies = new Set<string>();

    investments.forEach((inv) => {
      const investedAmt = inv.investedAmount || 0;
      const accountCurrency = inv.account?.currency;
      if (accountCurrency) encounteredCurrencies.add(accountCurrency);

      totalInvestedAmount += investedAmt;
      totalDividends += inv.dividend || 0;

      const priceInfo = priceMap.get(inv.symbol);
      const currentPrice = priceInfo?.price;
      const stockCurrency = priceInfo?.currency;

      if (stockCurrency && accountCurrency && stockCurrency !== accountCurrency) {
        valueIsEstimate = true;
      }
      if (stockCurrency) encounteredCurrencies.add(stockCurrency);

      if (currentPrice !== null && currentPrice !== undefined && inv.shares) {
        estimatedCurrentMarketValue += currentPrice * inv.shares;
      } else {
        estimatedCurrentMarketValue += investedAmt;
        if (!priceMap.has(inv.symbol)) {
          console.warn(
            `Price data completely missing for symbol ${inv.symbol}. Using invested amount.`,
          );
        } else {
          console.warn(`Price is null/undefined for symbol ${inv.symbol}. Using invested amount.`);
        }
      }
    });

    if (encounteredCurrencies.size > 1) {
      valueIsEstimate = true;
    } else if (encounteredCurrencies.size === 1) {
      const singleCurrency = Array.from(encounteredCurrencies)[0];
      if (singleCurrency !== preferredCurrency) {
        valueIsEstimate = true;
      }
    }

    const overallGainLoss = estimatedCurrentMarketValue - totalInvestedAmount;
    const overallGainLossPercentage =
      totalInvestedAmount !== 0 ? (overallGainLoss / totalInvestedAmount) * 100 : 0;

    return c.json({
      totalInvestedAmount: parseFloat(totalInvestedAmount.toFixed(2)),
      currentMarketValue: parseFloat(estimatedCurrentMarketValue.toFixed(2)),
      totalDividends: parseFloat(totalDividends.toFixed(2)),
      overallGainLoss: parseFloat(overallGainLoss.toFixed(2)),
      overallGainLossPercentage: parseFloat(overallGainLossPercentage.toFixed(2)),
      numberOfAccounts: accounts.length,
      numberOfHoldings: investments.length,
      currency: preferredCurrency,
      valueIsEstimate: valueIsEstimate,
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Portfolio Summary Error:', err);
    throw new HTTPException(500, {
      message:
        err instanceof Error ? err.message : 'Something went wrong calculating portfolio summary',
    });
  }
});

investmentRouter.get('/stocks/search', authMiddleware, async (c) => {
  try {
    const symbol = c.req.query('q');
    if (!symbol) {
      throw new HTTPException(400, { message: 'Symbol is required' });
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        symbol,
      )}"esCount=10&lang=en-US`,
    );

    if (!response.ok) {
      let errorBody = 'Could not fetch stock data from provider.';
      try {
        errorBody = await response.text();
      } catch (_) {}
      console.error(`Yahoo Search API Error (${response.status}): ${errorBody}`);
      throw new HTTPException(response.status as StatusCode, {
        message: `Failed to search stocks. Provider returned status ${response.status}.`,
      });
    }

    const data = await response.json();

    if (!data.quotes || !Array.isArray(data.quotes)) {
      console.warn('Yahoo Search API returned unexpected format:', data);
      return c.json([]);
    }

    const formattedData = data.quotes
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || 'N/A',
        exchange: quote.exchange || 'N/A',
        type: quote.quoteType || 'N/A',
      }))
      .filter((q: any) => q.symbol);

    return c.json(formattedData);
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Stock Search Internal Error:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong during stock search',
    });
  }
});

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
      let errorBody = 'Could not fetch stock data from provider.';
      try {
        errorBody = await response.text();
      } catch (_) {}
      console.error(`Yahoo Chart API Error (${response.status}) for ${symbol}: ${errorBody}`);
      throw new HTTPException(response.status as StatusCode, {
        message: `Failed to fetch stock price for ${symbol}. Provider returned status ${response.status}.`,
      });
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]?.meta) {
      console.warn(
        `Unexpected data structure from Yahoo for ${symbol}:`,
        JSON.stringify(data).substring(0, 500),
      );
      throw new HTTPException(404, {
        message: `Stock symbol '${symbol}' not found or data unavailable.`,
      });
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const lastPrice = meta?.regularMarketPrice;
    const previousClose = meta?.previousClose;

    if (typeof lastPrice !== 'number') {
      throw new HTTPException(404, {
        message: `Current market price not available for ${symbol}.`,
      });
    }

    let change = null;
    let changePercent = null;

    if (typeof lastPrice === 'number' && typeof previousClose === 'number' && previousClose !== 0) {
      change = lastPrice - previousClose;
      changePercent = (change / previousClose) * 100;
    }

    return c.json({
      symbol: symbol.toUpperCase(),
      price: lastPrice,
      change: change !== null ? parseFloat(change.toFixed(2)) : null,
      changePercent: changePercent !== null ? parseFloat(changePercent.toFixed(2)) : null,
      exchange: meta?.exchangeName || 'N/A',
      currency: meta?.currency || 'N/A',
      companyName: meta?.longName || meta?.shortName || 'N/A',
      marketState: meta?.marketState || 'N/A',
      regularMarketTime: meta?.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null,
      fiftyTwoWeekHigh: result.meta?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.meta?.fiftyTwoWeekLow,
      regularMarketDayHigh: result.meta?.regularMarketDayHigh,
      regularMarketDayLow: result.meta?.regularMarketDayLow,
      regularMarketVolume: result.meta?.regularMarketVolume,
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error(`Stock Price Internal Error for ${c.req.param('symbol')}:`, err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong fetching stock price',
    });
  }
});

investmentRouter.get('/details/:id', authMiddleware, async (c) => {
  try {
    const investmentId = c.req.param('id');
    const userId = await c.get('userId' as any);

    const investmentData = await db.query.Investment.findFirst({
      where: eq(Investment.id, investmentId),
      with: {
        account: {
          columns: { userId: true },
        },
      },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    if (!investmentData) {
      throw new HTTPException(404, { message: 'Investment data not found' });
    }
    if (investmentData.account?.userId !== userId) {
      throw new HTTPException(403, { message: 'Access denied.' });
    }

    const { account, ...returnData } = investmentData;

    return c.json(returnData);
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error fetching investment details:', err);
    throw new HTTPException(500, {
      message:
        err instanceof Error ? err.message : 'Something went wrong fetching investment details',
    });
  }
});

investmentRouter.put('/:id/update-divident', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    const userId = await c.get('userId' as any);
    const { dividend } = await c.req.json();

    const existingInvestment = await db.query.Investment.findFirst({
      where: eq(Investment.id, invId),
      with: {
        account: { columns: { userId: true } },
      },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    if (!existingInvestment) throw new HTTPException(404, { message: 'Investment not found.' });
    if (existingInvestment.account?.userId !== userId)
      throw new HTTPException(403, { message: 'Permission denied.' });

    const dividendValue = Number(dividend);
    if (isNaN(dividendValue) || dividendValue < 0) {
      throw new HTTPException(400, { message: 'Invalid dividend value' });
    }

    await db
      .update(Investment)
      .set({
        dividend: dividendValue,
        updatedAt: new Date(),
      })
      .where(eq(Investment.id, invId))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    return c.json({ message: 'Investment dividend updated successfully', id: invId });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error updating dividend:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong updating dividend',
    });
  }
});

investmentRouter.get('/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = await c.get('userId' as any);
    const { page = 1, limit = 10, sortBy = 'purchaseDate', sortOrder = 'desc' } = c.req.query();

    const investmentAcc = await db.query.InvestmentAccount.findFirst({
      where: and(eq(InvestmentAccount.id, accountId), eq(InvestmentAccount.userId, userId)),
      columns: { id: true },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error checking account: ${err.message}` });
    });

    if (!investmentAcc) {
      throw new HTTPException(404, { message: 'Investment account not found or access denied.' });
    }

    const allowedSortFields: (keyof InferSelectModel<typeof Investment>)[] = [
      'id',
      'createdAt',
      'updatedAt',
      'symbol',
      'shares',
      'purchasePrice',
      'purchaseDate',
      'dividend',
      'investedAmount',
    ];
    const validSortBy = allowedSortFields.includes(
      sortBy as keyof InferSelectModel<typeof Investment>,
    )
      ? (sortBy as keyof InferSelectModel<typeof Investment>)
      : 'purchaseDate';

    const sortColumn = Investment[validSortBy];
    if (!sortColumn) {
      throw new HTTPException(400, { message: 'Invalid sort field specified for investments.' });
    }

    const sortDirection = sortOrder.toLowerCase() === 'asc' ? asc : desc;
    const orderByClause = sortDirection(sortColumn);

    const totalQuery = await db
      .select({ tot: count(Investment.id) })
      .from(Investment)
      .where(eq(Investment.account, accountId))
      .then((res) => res[0]?.tot ?? 0)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error counting investments: ${err.message}` });
      });

    const investments = await db.query.Investment.findMany({
      where: eq(Investment.account, accountId),
      limit: +limit,
      offset: +limit * (+page - 1),
      orderBy: [orderByClause],
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error fetching investments: ${err.message}` });
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
    if (err instanceof HTTPException) throw err;
    console.error('Error fetching investments:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong fetching investments',
    });
  }
});

investmentRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    const userId = await c.get('userId' as any);
    const { shares, purchasePrice, purchaseDate } = await c.req.json();

    const existingInvestment = await db.query.Investment.findFirst({
      where: eq(Investment.id, invId),
      with: {
        account: {
          columns: { userId: true },
        },
      },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    if (!existingInvestment) {
      throw new HTTPException(404, { message: 'Investment not found.' });
    }

    if (existingInvestment.account?.userId !== userId) {
      throw new HTTPException(403, {
        message: 'You do not have permission to edit this investment.',
      });
    }

    const sharesValue = Number(shares);
    const purchasePriceValue = Number(purchasePrice);

    if (
      isNaN(sharesValue) ||
      isNaN(purchasePriceValue) ||
      sharesValue <= 0 ||
      purchasePriceValue < 0
    ) {
      throw new HTTPException(400, { message: 'Invalid shares or purchase price' });
    }

    await db
      .update(Investment)
      .set({
        shares: sharesValue,
        purchasePrice: purchasePriceValue,
        purchaseDate: new Date(purchaseDate),
        investedAmount: sharesValue * purchasePriceValue,
        updatedAt: new Date(),
      })
      .where(eq(Investment.id, invId))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    return c.json({ message: 'Investment record Updated successfully', id: invId });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error updating investment:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong updating investment',
    });
  }
});

investmentRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const invId = c.req.param('id');
    const userId = await c.get('userId' as any);

    const existingInvestment = await db.query.Investment.findFirst({
      where: eq(Investment.id, invId),
      with: {
        account: {
          columns: { userId: true },
        },
      },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    if (!existingInvestment) {
      throw new HTTPException(404, { message: 'Investment not found.' });
    }
    if (existingInvestment.account?.userId !== userId) {
      throw new HTTPException(403, {
        message: 'You do not have permission to delete this investment.',
      });
    }

    await db
      .delete(Investment)
      .where(eq(Investment.id, invId))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    return c.json({ message: 'Investment record Deleted Successfully!' });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error deleting investment:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong deleting investment',
    });
  }
});

investmentRouter.post('/', authMiddleware, zValidator('json', investmentSchema), async (c) => {
  try {
    const { symbol, shares, purchasePrice, purchaseDate, investmentAccount } = await c.req.json();
    const userId = await c.get('userId' as any);

    const investmentAcc = await db.query.InvestmentAccount.findFirst({
      where: and(eq(InvestmentAccount.id, investmentAccount), eq(InvestmentAccount.userId, userId)),
      columns: { id: true, currency: true },
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Error: ${err.message}` });
    });

    if (!investmentAcc) {
      throw new HTTPException(403, { message: 'Cannot add investment to this account.' });
    }

    const sharesValue = Number(shares);
    const purchasePriceValue = Number(purchasePrice);

    if (
      isNaN(sharesValue) ||
      isNaN(purchasePriceValue) ||
      sharesValue <= 0 ||
      purchasePriceValue < 0
    ) {
      throw new HTTPException(400, { message: 'Invalid shares or purchase price' });
    }

    const newInvestment = await db
      .insert(Investment)
      .values({
        symbol: symbol.toUpperCase(),
        shares: sharesValue,
        purchasePrice: purchasePriceValue,
        purchaseDate: new Date(purchaseDate),
        account: investmentAccount,
        investedAmount: purchasePriceValue * sharesValue,
      })
      .returning()
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });

    return c.json({ message: 'Investment created successfully', data: newInvestment[0] });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error creating investment:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong creating investment',
    });
  }
});

export default investmentRouter;
