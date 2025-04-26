import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { Investment, InvestmentAccount, User } from '../database/schema';
import { zValidator } from '@hono/zod-validator';
import { historicalPortfolioQuerySchema, investmentSchema } from '../utils/schema.validations';
import { eq, count, sql, and, inArray, desc, InferSelectModel, asc } from 'drizzle-orm';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';
import { StatusCode } from 'hono/utils/http-status';
import { PromisePool } from '@supercharge/promise-pool';
import { parseISO, format as formatDateFn, subDays, eachDayOfInterval, isValid } from 'date-fns';
import { fetchHistoricalPricesForSymbol } from '../utils/finance';

const investmentRouter = new Hono();

investmentRouter.get('/oldest-date', authMiddleware, async (c) => {
  try {
    const userId = await c.get('userId' as any);
    // Use a join to ensure the investment belongs to the user
    const result = await db
      .select({ purchaseDate: Investment.purchaseDate })
      .from(Investment)
      .leftJoin(InvestmentAccount, eq(Investment.account, InvestmentAccount.id))
      .where(eq(InvestmentAccount.userId, userId))
      .orderBy(asc(Investment.purchaseDate))
      .limit(1);

    const oldestDate =
      result.length && result[0].purchaseDate
        ? result[0].purchaseDate.toISOString().split('T')[0]
        : null;
    return c.json({ oldestDate });
  } catch (err) {
    console.error('Error fetching oldest investment date:', err);
    return c.json({ oldestDate: null }, 200);
  }
});

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
    const preferredCurrency = userPrefs?.preferredCurrency || 'INR';

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
      )}&quotesCount=10&lang=en-US`,
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

    if (data.quotes.length === 0) {
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

      if (response.status === 404) {
        throw new HTTPException(404, {
          message: `Stock symbol '${symbol}' not found on Yahoo Finance.`,
        });
      } else {
        throw new HTTPException(502, {
          message: `Failed to fetch stock price for ${symbol} from provider. Provider returned status ${response.status}.`,
        });
      }
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]?.meta) {
      console.warn(
        `Unexpected data structure from Yahoo for ${symbol}:`,
        JSON.stringify(data).substring(0, 500),
      );
      throw new HTTPException(404, {
        message: `Stock symbol '${symbol}' data unavailable from provider.`,
      });
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const lastPrice = meta?.regularMarketPrice;

    if (typeof lastPrice !== 'number') {
      console.warn(`regularMarketPrice is not a number for ${symbol}:`, data);
      throw new HTTPException(404, {
        message: `Current market price not available for '${symbol}' from provider.`,
      });
    }

    const previousClose = meta?.previousClose;
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

investmentRouter.get('/stocks/historical-price/:symbol', authMiddleware, async (c) => {
  try {
    const { symbol } = c.req.param();
    const dateParam = c.req.query('date');
    if (!symbol) {
      throw new HTTPException(400, { message: 'Stock symbol is required' });
    }
    if (!dateParam) {
      throw new HTTPException(400, {
        message: 'Date is required in YYYY-MM-DD format (e.g., ?date=2023-10-26)',
      });
    }

    const requestedDate = new Date(dateParam);
    if (isNaN(requestedDate.getTime())) {
      throw new HTTPException(400, { message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const period1 = Math.floor(
      new Date(
        requestedDate.getFullYear(),
        requestedDate.getMonth(),
        requestedDate.getDate(),
        0,
        0,
        0,
      ).getTime() / 1000,
    );
    const period2 = Math.floor(
      new Date(
        requestedDate.getFullYear(),
        requestedDate.getMonth(),
        requestedDate.getDate(),
        23,
        59,
        59,
      ).getTime() / 1000,
    );
    const interval = '1d';

    const historicalResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol,
      )}?period1=${period1}&period2=${period2}&interval=${interval}`,
    );

    if (!historicalResponse.ok) {
      let errorBody = 'Could not fetch historical stock data from provider.';
      try {
        errorBody = await historicalResponse.text();
      } catch (_) {}
      console.error(
        `Yahoo Historical Chart API Error (${historicalResponse.status}) for ${symbol} on ${dateParam}: ${errorBody}`,
      );

      if (historicalResponse.status === 404) {
        throw new HTTPException(404, {
          message: `Stock symbol '${symbol}' not found on Yahoo Finance or no data for ${dateParam}.`,
        });
      } else {
        throw new HTTPException(502, {
          message: `Failed to fetch historical stock price for ${symbol} on ${dateParam}. Provider returned status ${historicalResponse.status}.`,
        });
      }
    }

    const historicalData = await historicalResponse.json();

    if (!historicalData.chart?.result?.[0]) {
      console.warn(
        `No chart result found for ${symbol} on ${dateParam} or unexpected data structure from Yahoo:`,
        JSON.stringify(historicalData).substring(0, 500),
      );
      throw new HTTPException(404, {
        message: `No historical data available for '${symbol}' on ${dateParam}.`,
      });
    }

    const result = historicalData.chart.result[0];

    if (
      !result.timestamp ||
      result.timestamp.length === 0 ||
      !result.indicators?.quote?.[0]?.close ||
      result.indicators.quote[0].close.length === 0
    ) {
      console.warn(
        `No timestamp or price data in response for ${symbol} on ${dateParam}:`,
        historicalData,
      );
      throw new HTTPException(404, {
        message: `No price data available for '${symbol}' on ${dateParam}. Market might have been closed or data missing.`,
      });
    }

    const meta = result.meta;
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    const historicalTimestamp = timestamps[0];
    const historicalPrice = quotes.close[0];
    const historicalOpen = quotes.open?.[0];
    const historicalHigh = quotes.high?.[0];
    const historicalLow = quotes.low?.[0];
    const historicalVolume = quotes.volume?.[0];

    const formattedDate = new Date(historicalTimestamp * 1000).toISOString().split('T')[0];

    return c.json({
      symbol: symbol.toUpperCase(),
      date: formattedDate,
      price: historicalPrice,
      currency: meta?.currency || 'N/A',
      exchange: meta?.exchangeName || 'N/A',
      companyName: meta?.longName || meta?.shortName || 'N/A',
      ...(historicalOpen !== undefined && { open: historicalOpen }),
      ...(historicalHigh !== undefined && { high: historicalHigh }),
      ...(historicalLow !== undefined && { low: historicalLow }),
      ...(historicalVolume !== undefined && { volume: historicalVolume }),
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error(
      `Stock Historical Price Internal Error for ${c.req.param('symbol')} on date ${c.req.query(
        'date',
      )}:`,
      err,
    );
    throw new HTTPException(500, {
      message:
        err instanceof Error ? err.message : 'Something went wrong fetching historical stock price',
    });
  }
});

// Helper function to check if date is a weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

investmentRouter.get(
  '/portfolio-historical',
  authMiddleware,
  zValidator('query', historicalPortfolioQuerySchema),
  async (c) => {
    try {
      const userId = c.get('userId' as any);
      const { period, startDate: customStartDate, endDate: customEndDate } = c.req.valid('query');

      const userPrefs = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: { preferredCurrency: true },
      }).catch((err) => {
        throw new HTTPException(500, { message: `DB Error: ${err.message}` });
      });
      const preferredCurrency = userPrefs?.preferredCurrency || 'INR';

      const accounts = await db.query.InvestmentAccount.findMany({
        where: eq(InvestmentAccount.userId, userId),
        columns: { id: true, currency: true },
      });
      const accountIds = accounts.map((acc) => acc.id);

      if (accountIds.length === 0) {
        return c.json({ data: [], currency: preferredCurrency, valueIsEstimate: false });
      }

      const investments = await db.query.Investment.findMany({
        where: inArray(Investment.account, accountIds),
        columns: { symbol: true, shares: true, investedAmount: true, account: true },
      });

      if (investments.length === 0) {
        return c.json({ data: [], currency: preferredCurrency, valueIsEstimate: false });
      }

      // Use current time as end date to avoid future date issues with Yahoo Finance
      const now = new Date();
      let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date;

      // Handle custom date range if provided
      if (customStartDate && customEndDate) {
        const parsedStartDate = parseISO(customStartDate);
        const parsedEndDate = parseISO(customEndDate);

        if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
          throw new HTTPException(400, { message: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        // Ensure end date is not in the future
        if (parsedEndDate > endDate) {
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else {
          endDate = parsedEndDate;
        }
        startDate = parsedStartDate;
      } else {
        // Use predefined periods as before
        switch (period) {
          case '7d':
            startDate = subDays(endDate, 7);
            break;
          case '90d':
            startDate = subDays(endDate, 90);
            break;
          case '1y':
            startDate = subDays(endDate, 365);
            break;
          case '30d':
          default:
            startDate = subDays(endDate, 30);
            break;
        }
      }

      startDate.setHours(0, 0, 0, 0); // Start of the day
      endDate.setHours(23, 59, 59, 999); // End of the day

      // Get all dates in range
      const allDatesInRange = eachDayOfInterval({ start: startDate, end: endDate });
      // Filter out weekends
      const marketDays = allDatesInRange.filter((date) => !isWeekend(date));

      const uniqueSymbols = Array.from(new Set(investments.map((inv) => inv.symbol)));

      const allPricesMap = new Map<string, Map<string, number | null>>();

      const { results, errors: poolErrors } = await PromisePool.for(uniqueSymbols)
        .withConcurrency(5)
        .handleError(async (error, symbol) => {
          console.error(
            `Portfolio Historical Pool: Failed to fetch price range for ${symbol}:`,
            error,
          );
        })
        .process(async (symbol) => {
          try {
            const prices = await fetchHistoricalPricesForSymbol(symbol, startDate, endDate);
            return { symbol, prices };
          } catch (error) {
            console.error(`Failed to fetch historical prices for ${symbol}:`, error);
            return { symbol, prices: new Map() };
          }
        });

      results.forEach((result) => {
        if (result) {
          allPricesMap.set(result.symbol, result.prices);
        }
      });

      if (poolErrors.length > 0) {
        console.warn(
          `Portfolio Historical: Encountered ${poolErrors.length} errors fetching price ranges.`,
        );
      }

      let valueIsEstimate = false;
      const accountCurrencies = new Set(accounts.map((a) => a.currency));
      if (accountCurrencies.size > 1) valueIsEstimate = true;

      // Calculate values for market days only
      const marketDayValues = marketDays.map((date) => {
        const dateString = formatDateFn(date, 'yyyy-MM-dd');
        let dailyTotalValue = 0;
        let hasValidPrices = false;

        investments.forEach((inv) => {
          const pricesForSymbol = allPricesMap.get(inv.symbol);
          const priceOnDate = pricesForSymbol?.get(dateString);

          if (priceOnDate !== undefined && priceOnDate !== null && inv.shares) {
            dailyTotalValue += inv.shares * priceOnDate;
            hasValidPrices = true;
          }
        });

        if (!hasValidPrices) {
          return null;
        }

        return {
          date: dateString,
          value: parseFloat(dailyTotalValue.toFixed(2)),
        };
      });

      // Filter out null values and sort by date
      const validMarketDayValues = marketDayValues
        .filter(
          (point): point is { date: string; value: number } => point !== null && point.value > 0,
        )
        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

      // If we have too few points, mark as estimate
      if (validMarketDayValues.length < marketDays.length * 0.5) {
        valueIsEstimate = true;
      }

      return c.json({
        data: validMarketDayValues,
        currency: preferredCurrency,
        valueIsEstimate: valueIsEstimate,
      });
    } catch (err) {
      if (err instanceof HTTPException) throw err;
      console.error('Portfolio Historical Data Error:', err);
      throw new HTTPException(500, {
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong calculating historical portfolio value',
      });
    }
  },
);

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

investmentRouter.put('/:id/update-dividend', authMiddleware, async (c) => {
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

    const newInvestedAmount = sharesValue * purchasePriceValue;

    const result = await db.transaction(async (tx) => {
      const existingInvestment = await tx.query.Investment.findFirst({
        where: eq(Investment.id, invId),
        with: {
          account: {
            columns: { userId: true },
          },
        },
      });

      if (!existingInvestment) {
        throw new HTTPException(404, { message: 'Investment not found.' });
      }

      if (existingInvestment.account?.userId !== userId) {
        throw new HTTPException(403, {
          message: 'You do not have permission to edit this investment.',
        });
      }

      const oldInvestedAmount = existingInvestment.investedAmount || 0;
      const balanceChange = newInvestedAmount - oldInvestedAmount;

      await tx
        .update(InvestmentAccount)
        .set({
          balance: sql`${InvestmentAccount.balance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(InvestmentAccount.id, existingInvestment.account as string));

      await tx
        .update(Investment)
        .set({
          shares: sharesValue,
          purchasePrice: purchasePriceValue,
          purchaseDate: new Date(purchaseDate),
          investedAmount: newInvestedAmount,
          updatedAt: new Date(),
        })
        .where(eq(Investment.id, invId));

      return { id: invId };
    });

    return c.json({ message: 'Investment record Updated successfully', id: result.id });
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

    const result = await db.transaction(async (tx) => {
      const existingInvestment = await tx.query.Investment.findFirst({
        where: eq(Investment.id, invId),
        with: {
          account: {
            columns: { userId: true },
          },
        },
      });

      if (!existingInvestment) {
        throw new HTTPException(404, { message: 'Investment not found.' });
      }
      if (existingInvestment.account?.userId !== userId) {
        throw new HTTPException(403, {
          message: 'You do not have permission to delete this investment.',
        });
      }

      const investedAmount = existingInvestment.investedAmount || 0;

      await tx
        .update(InvestmentAccount)
        .set({
          balance: sql`${InvestmentAccount.balance} - ${investedAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(InvestmentAccount.id, existingInvestment.account as string));

      await tx.delete(Investment).where(eq(Investment.id, invId));

      return { id: invId };
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

    const investedAmountValue = purchasePriceValue * sharesValue;

    const result = await db.transaction(async (tx) => {
      const investmentAcc = await tx.query.InvestmentAccount.findFirst({
        where: and(
          eq(InvestmentAccount.id, investmentAccount),
          eq(InvestmentAccount.userId, userId),
        ),
        columns: { id: true },
      }).catch((err) => {
        throw new HTTPException(500, { message: `DB Error checking account: ${err.message}` });
      });

      if (!investmentAcc) {
        throw new HTTPException(403, { message: 'Cannot add investment to this account.' });
      }

      await tx
        .update(InvestmentAccount)
        .set({
          balance: sql`${InvestmentAccount.balance} + ${investedAmountValue}`,
          updatedAt: new Date(),
        })
        .where(eq(InvestmentAccount.id, investmentAccount))
        .catch((err) => {
          throw new HTTPException(500, {
            message: `DB Error updating account balance: ${err.message}`,
          });
        });

      const newInvestment = await tx
        .insert(Investment)
        .values({
          symbol: symbol.toUpperCase(),
          shares: sharesValue,
          purchasePrice: purchasePriceValue,
          purchaseDate: parseISO(purchaseDate),
          account: investmentAccount,
          investedAmount: investedAmountValue,
        })
        .returning()
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Error creating investment: ${err.message}` });
        });

      if (!newInvestment || newInvestment.length === 0) {
        throw new HTTPException(500, { message: 'Failed to create investment record.' });
      }

      return newInvestment[0];
    });

    return c.json({
      message: 'Investment created and account balance updated successfully',
      data: result,
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error('Error creating investment and updating balance:', err);
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong creating investment',
    });
  }
});

export default investmentRouter;
