// src/services/investment.service.ts
import { db } from '../database';
import { Investment, InvestmentAccount, User } from '../database/schema';
import {
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  sql,
  InferSelectModel,
  AnyColumn,
  InferInsertModel,
} from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { PromisePool } from '@supercharge/promise-pool';
import {
  parseISO,
  isValid as isValidDate,
  format as formatDateFn,
  subDays,
  eachDayOfInterval,
} from 'date-fns';
// Import the centralized finance service and its types
import {
  financeService,
  StockPriceResult,
  StockSearchResult,
  HistoricalPriceResult,
} from './finance.service';

// Define return types used within this service
type PortfolioSummary = {
  totalInvestedAmount: number;
  currentMarketValue: number;
  totalDividends: number;
  overallGainLoss: number;
  overallGainLossPercentage: number;
  numberOfAccounts: number;
  numberOfHoldings: number;
  currency: string;
  valueIsEstimate: boolean;
};

type HistoricalPortfolioPoint = {
  date: string; // YYYY-MM-DD
  value: number;
};

type HistoricalPortfolioResult = {
  data: HistoricalPortfolioPoint[];
  currency: string;
  valueIsEstimate: boolean;
};

// Define type for Investment with nested account details needed
type InvestmentWithAccount = InferSelectModel<typeof Investment> & {
  account: { currency: string | null; userId: string } | null;
};

export class InvestmentService {
  async getOldestInvestmentDate(userId: string): Promise<string | null> {
    const result = await db
      .select({ purchaseDate: Investment.purchaseDate })
      .from(Investment)
      .innerJoin(InvestmentAccount, eq(Investment.account, InvestmentAccount.id))
      .where(eq(InvestmentAccount.userId, userId))
      .orderBy(asc(Investment.purchaseDate))
      .limit(1)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Error fetching oldest date: ${err.message}` });
      });

    return result[0]?.purchaseDate?.toISOString().split('T')[0] ?? null;
  }

  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    const userPrefs = await db.query.User.findFirst({
      where: eq(User.id, userId),
      columns: { preferredCurrency: true },
    });
    const preferredCurrency = userPrefs?.preferredCurrency || 'USD';

    const accounts = await db.query.InvestmentAccount.findMany({
      where: eq(InvestmentAccount.userId, userId),
      columns: { id: true, currency: true },
    });

    if (accounts.length === 0) {
      return {
        totalInvestedAmount: 0,
        currentMarketValue: 0,
        totalDividends: 0,
        overallGainLoss: 0,
        overallGainLossPercentage: 0,
        numberOfAccounts: 0,
        numberOfHoldings: 0,
        currency: preferredCurrency,
        valueIsEstimate: false,
      };
    }

    const accountIds = accounts.map((acc) => acc.id);
    const investments: InvestmentWithAccount[] = await db.query.Investment.findMany({
      where: inArray(Investment.account, accountIds),
      with: { account: { columns: { currency: true, userId: true } } },
    });

    if (investments.length === 0) {
      return {
        totalInvestedAmount: 0,
        currentMarketValue: 0,
        totalDividends: 0,
        overallGainLoss: 0,
        overallGainLossPercentage: 0,
        numberOfAccounts: accounts.length,
        numberOfHoldings: 0,
        currency: preferredCurrency,
        valueIsEstimate: false,
      };
    }

    const uniqueSymbols = Array.from(new Set(investments.map((inv) => inv.symbol))); // Convert Set to Array here
    const priceMap = new Map<string, { price: number | null; currency: string | null }>();
    let valueIsEstimate = false;

    const { results: priceResults } = await PromisePool.for(uniqueSymbols) // Use the array
      .withConcurrency(5)
      .handleError(async (error, symbol) =>
        console.error(`Portfolio Summary Pool: Failed for ${symbol}:`, error),
      )
      .process(async (symbol) => {
        try {
          const priceData = await financeService.getCurrentStockPrice(symbol);
          return { symbol, price: priceData.price, currency: priceData.currency };
        } catch (e: any) {
          if (e instanceof HTTPException && e.status === 404) {
            console.warn(`Could not find current price for symbol ${symbol}.`);
          } else {
            console.error(`Error fetching current price for ${symbol} in pool:`, e);
          }
          return { symbol, price: null, currency: null };
        }
      });

    priceResults.forEach((result) => {
      if (result && result.symbol) {
        priceMap.set(result.symbol, { price: result.price, currency: result.currency });
      }
    });

    let totalInvestedAmount = 0;
    let estimatedCurrentMarketValue = 0;
    let totalDividends = 0;
    const encounteredCurrenciesSet = new Set<string>(); // Use a Set initially

    investments.forEach((inv) => {
      const investedAmt = inv.investedAmount ?? 0;
      const accountCurrency = inv.account?.currency;
      if (accountCurrency) encounteredCurrenciesSet.add(accountCurrency); // Add to Set

      totalInvestedAmount += investedAmt;
      totalDividends += inv.dividend ?? 0;

      const priceInfo = priceMap.get(inv.symbol);
      const currentPrice = priceInfo?.price;
      const stockCurrency = priceInfo?.currency;

      if (stockCurrency && accountCurrency && stockCurrency !== accountCurrency)
        valueIsEstimate = true;
      if (stockCurrency) encounteredCurrenciesSet.add(stockCurrency); // Add to Set

      if (currentPrice !== null && currentPrice !== undefined && inv.shares) {
        estimatedCurrentMarketValue += currentPrice * inv.shares;
      } else {
        estimatedCurrentMarketValue += investedAmt;
        valueIsEstimate = true;
      }
    });

    // Convert Set to Array for size check and iteration if needed
    const encounteredCurrencies = Array.from(encounteredCurrenciesSet);

    if (!valueIsEstimate && encounteredCurrencies.length === 1) {
      const singleCurrency = encounteredCurrencies[0];
      if (singleCurrency !== preferredCurrency) valueIsEstimate = true;
    } else if (encounteredCurrencies.length > 1) {
      valueIsEstimate = true;
    }

    const overallGainLoss = estimatedCurrentMarketValue - totalInvestedAmount;
    const overallGainLossPercentage =
      totalInvestedAmount !== 0 ? (overallGainLoss / totalInvestedAmount) * 100 : 0;
    const formatNumber = (num: number) => parseFloat(num.toFixed(2));

    return {
      totalInvestedAmount: formatNumber(totalInvestedAmount),
      currentMarketValue: formatNumber(estimatedCurrentMarketValue),
      totalDividends: formatNumber(totalDividends),
      overallGainLoss: formatNumber(overallGainLoss),
      overallGainLossPercentage: formatNumber(overallGainLossPercentage),
      numberOfAccounts: accounts.length,
      numberOfHoldings: investments.length,
      currency: preferredCurrency,
      valueIsEstimate: valueIsEstimate,
    };
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    return financeService.searchStocks(query);
  }

  async getStockPrice(symbol: string): Promise<StockPriceResult> {
    return financeService.getCurrentStockPrice(symbol);
  }

  async getHistoricalStockPrice(symbol: string, dateStr: string): Promise<HistoricalPriceResult> {
    return financeService.getHistoricalStockPrice(symbol, dateStr);
  }

  async getHistoricalPortfolioValue(
    userId: string,
    period?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<HistoricalPortfolioResult> {
    let startDate: Date;
    let endDate: Date;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (customStartDate && customEndDate) {
      startDate = parseISO(customStartDate);
      endDate = parseISO(customEndDate);
      if (!isValidDate(startDate) || !isValidDate(endDate) || startDate >= endDate)
        throw new HTTPException(400, { message: 'Invalid custom date range.' });
      if (endDate > today) endDate = today;
    } else {
      endDate = today;
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
    startDate.setHours(0, 0, 0, 0);

    const accounts = await db.query.InvestmentAccount.findMany({
      where: eq(InvestmentAccount.userId, userId),
      columns: { id: true, currency: true },
    });
    if (accounts.length === 0) return { data: [], currency: 'USD', valueIsEstimate: false };
    const accountIds = accounts.map((acc) => acc.id);

    const investments = await db.query.Investment.findMany({
      where: inArray(Investment.account, accountIds),
      columns: {
        symbol: true,
        shares: true,
        investedAmount: true,
        account: true,
        purchaseDate: true,
      },
    });
    if (investments.length === 0)
      return { data: [], currency: accounts[0].currency, valueIsEstimate: false };

    const marketDays = eachDayOfInterval({ start: startDate, end: endDate }).filter(
      (d) => !isWeekend(d),
    );
    const uniqueSymbols = Array.from(new Set(investments.map((inv) => inv.symbol))); // Convert Set to Array here
    const allPricesMap = new Map<string, Map<string, number | null>>();
    let valueIsEstimate = accounts.some((acc, i, arr) => i > 0 && acc.currency !== arr[0].currency);

    const { results: priceResults } = await PromisePool.for(uniqueSymbols) // Use the array
      .withConcurrency(5)
      .handleError(async (error, symbol) =>
        console.error(`Hist. Portfolio Pool: Failed for ${symbol}:`, error),
      )
      .process(async (symbol) => ({
        symbol,
        prices: await financeService.fetchHistoricalPricesForSymbol(symbol, startDate, endDate),
      }));

    priceResults.forEach((result) => {
      if (result) allPricesMap.set(result.symbol, result.prices);
    });

    const portfolioValues = marketDays
      .map((date) => {
        const dateString = formatDateFn(date, 'yyyy-MM-dd');
        let dailyTotalValue = 0;
        let pricesAvailableForDay = false;

        investments.forEach((inv) => {
          if (inv.purchaseDate && inv.purchaseDate <= date) {
            const pricesForSymbol = allPricesMap.get(inv.symbol);
            const priceOnDate = pricesForSymbol?.get(dateString);
            if (priceOnDate !== undefined && priceOnDate !== null && inv.shares) {
              dailyTotalValue += inv.shares * priceOnDate;
              pricesAvailableForDay = true;
            }
          }
        });
        return pricesAvailableForDay
          ? { date: dateString, value: parseFloat(dailyTotalValue.toFixed(2)) }
          : null;
      })
      .filter((point): point is HistoricalPortfolioPoint => point !== null && point.value >= 0);

    const preferredCurrency =
      (
        await db.query.User.findFirst({
          where: eq(User.id, userId),
          columns: { preferredCurrency: true },
        })
      )?.preferredCurrency || 'USD';
    // valueIsEstimate = valueIsEstimate || portfolioValues.length < marketDays.length * 0.8; // Optional check

    return { data: portfolioValues, currency: preferredCurrency, valueIsEstimate };
  }

  async getInvestmentDetails(
    investmentId: string,
    userId: string,
  ): Promise<Omit<InferSelectModel<typeof Investment>, 'account'>> {
    const result = await db
      .select({
        investment: {
          id: Investment.id,
          createdAt: Investment.createdAt,
          updatedAt: Investment.updatedAt,
          symbol: Investment.symbol,
          shares: Investment.shares,
          purchasePrice: Investment.purchasePrice,
          purchaseDate: Investment.purchaseDate,
          dividend: Investment.dividend,
          investedAmount: Investment.investedAmount,
        },
      })
      .from(Investment)
      .innerJoin(InvestmentAccount, eq(Investment.account, InvestmentAccount.id))
      .where(and(eq(Investment.id, investmentId), eq(InvestmentAccount.userId, userId)))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
      });

    if (!result || result.length === 0)
      throw new HTTPException(404, { message: 'Investment data not found or access denied.' });
    return result[0].investment;
  }

  async updateInvestmentDividend(
    investmentId: string,
    userId: string,
    dividend: number,
  ): Promise<{ message: string; id: string }> {
    if (isNaN(Number(dividend)) || dividend < 0)
      throw new HTTPException(400, { message: 'Invalid dividend value.' });

    const result = await db
      .update(Investment)
      .set({ dividend: Number(dividend), updatedAt: new Date() })
      .where(
        and(
          eq(Investment.id, investmentId),
          sql`${Investment.account} IN (SELECT ${InvestmentAccount.id} FROM ${InvestmentAccount} WHERE ${InvestmentAccount.userId} = ${userId})`,
        ),
      )
      .returning({ id: Investment.id })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Update Error: ${err.message}` });
      });

    if (result.length === 0)
      throw new HTTPException(404, { message: 'Investment not found or permission denied.' });
    return { message: 'Investment dividend updated successfully', id: investmentId };
  }

  async getInvestmentsForAccount(
    accountId: string,
    userId: string,
    page: number,
    limit: number,
    sortBy: keyof InferSelectModel<typeof Investment>,
    sortOrder: 'asc' | 'desc',
  ) {
    const account = await db.query.InvestmentAccount.findFirst({
      where: and(eq(InvestmentAccount.id, accountId), eq(InvestmentAccount.userId, userId)),
      columns: { id: true },
    });
    if (!account)
      throw new HTTPException(404, { message: 'Investment account not found or access denied.' });

    const sortColumn = Investment[sortBy] || Investment.purchaseDate;
    const orderByClause =
      sortOrder === 'asc' ? asc(sortColumn as AnyColumn) : desc(sortColumn as AnyColumn); // Cast needed

    const totalResult = await db
      .select({ count: count() })
      .from(Investment)
      .where(eq(Investment.account, accountId))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });
    const total = totalResult[0]?.count ?? 0;

    const investments = await db.query.Investment.findMany({
      where: eq(Investment.account, accountId),
      limit: limit,
      offset: limit * (page - 1),
      orderBy: [orderByClause],
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
    });

    return {
      data: investments,
      pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
    };
  }

  async updateInvestment(
    investmentId: string,
    userId: string,
    payload: Pick<InferInsertModel<typeof Investment>, 'shares' | 'purchasePrice' | 'purchaseDate'>,
  ): Promise<{ message: string; id: string }> {
    const { shares, purchasePrice, purchaseDate } = payload;

    const sharesValue = Number(shares);
    const purchasePriceValue = Number(purchasePrice);
    const purchaseDateValue =
      purchaseDate instanceof Date ? purchaseDate : parseISO(purchaseDate as unknown as string);

    if (isNaN(sharesValue) || sharesValue <= 0)
      throw new HTTPException(400, { message: 'Invalid shares amount.' });
    if (isNaN(purchasePriceValue) || purchasePriceValue < 0)
      throw new HTTPException(400, { message: 'Invalid purchase price.' });
    if (!isValidDate(purchaseDateValue))
      throw new HTTPException(400, { message: 'Invalid purchase date.' });

    const newInvestedAmount = sharesValue * purchasePriceValue;

    const result = await db.transaction(async (tx) => {
      const existingInvestment = await tx.query.Investment.findFirst({
        where: eq(Investment.id, investmentId),
        with: { account: { columns: { userId: true, id: true } } },
      });
      if (!existingInvestment) throw new HTTPException(404, { message: 'Investment not found.' });
      if (existingInvestment.account?.userId !== userId)
        throw new HTTPException(403, { message: 'Permission denied.' });

      const oldInvestedAmount = existingInvestment.investedAmount ?? 0;
      const balanceChange = newInvestedAmount - oldInvestedAmount;

      await tx
        .update(InvestmentAccount)
        .set({
          balance: sql`${InvestmentAccount.balance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(InvestmentAccount.id, existingInvestment.account!.id))
        .catch((err) => {
          throw new HTTPException(500, {
            message: `DB Update Account Balance Error: ${err.message}`,
          });
        });

      await tx
        .update(Investment)
        .set({
          shares: sharesValue,
          purchasePrice: purchasePriceValue,
          purchaseDate: purchaseDateValue,
          investedAmount: newInvestedAmount,
          updatedAt: new Date(),
        })
        .where(eq(Investment.id, investmentId))
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Update Investment Error: ${err.message}` });
        });

      return { id: investmentId };
    });
    return { message: 'Investment record Updated successfully', id: result.id };
  }

  async deleteInvestment(investmentId: string, userId: string): Promise<{ message: string }> {
    const result = await db.transaction(async (tx) => {
      const existingInvestment = await tx.query.Investment.findFirst({
        where: eq(Investment.id, investmentId),
        with: { account: { columns: { userId: true, id: true } } },
      });
      if (!existingInvestment) throw new HTTPException(404, { message: 'Investment not found.' });
      if (existingInvestment.account?.userId !== userId)
        throw new HTTPException(403, { message: 'Permission denied.' });

      const investedAmount = existingInvestment.investedAmount ?? 0;
      const balanceChange = -investedAmount;

      await tx
        .update(InvestmentAccount)
        .set({
          balance: sql`${InvestmentAccount.balance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(InvestmentAccount.id, existingInvestment.account!.id))
        .catch((err) => {
          throw new HTTPException(500, {
            message: `DB Update Account Balance Error: ${err.message}`,
          });
        });

      const deleted = await tx
        .delete(Investment)
        .where(eq(Investment.id, investmentId))
        .returning({ id: Investment.id });
      if (deleted.length === 0)
        throw new HTTPException(404, { message: 'Investment not found during delete operation.' });

      return { id: investmentId };
    });
    return { message: 'Investment record Deleted Successfully!' };
  }

  async createInvestment(
    userId: string,
    payload: Pick<
      InferInsertModel<typeof Investment>,
      'symbol' | 'shares' | 'purchasePrice' | 'purchaseDate' | 'account'
    > & { investmentAccount: string },
  ): Promise<{ message: string; data: InferSelectModel<typeof Investment> }> {
    const investmentAccountId = payload.investmentAccount ?? payload.account;

    const { symbol, shares, purchasePrice, purchaseDate } = payload;

    const sharesValue = Number(shares);
    const purchasePriceValue = Number(purchasePrice);
    const purchaseDateValue =
      purchaseDate instanceof Date ? purchaseDate : parseISO(purchaseDate as unknown as string);

    if (isNaN(sharesValue) || sharesValue <= 0)
      throw new HTTPException(400, { message: 'Invalid shares amount.' });
    if (isNaN(purchasePriceValue) || purchasePriceValue < 0)
      throw new HTTPException(400, { message: 'Invalid purchase price.' });
    if (!isValidDate(purchaseDateValue))
      throw new HTTPException(400, { message: 'Invalid purchase date.' });

    const investedAmountValue = purchasePriceValue * sharesValue;

    const result = await db.transaction(async (tx) => {
      const account = await tx.query.InvestmentAccount.findFirst({
        where: eq(InvestmentAccount.id, investmentAccountId),
        columns: { id: true },
      });
      if (!account)
        throw new HTTPException(403, { message: 'Investment account not found or access denied.' });

      await tx
        .update(InvestmentAccount)
        .set({
          balance: sql`${InvestmentAccount.balance} + ${investedAmountValue}`,
          updatedAt: new Date(),
        })
        .where(eq(InvestmentAccount.id, investmentAccountId))
        .catch((err) => {
          throw new HTTPException(500, {
            message: `DB Update Account Balance Error: ${err.message}`,
          });
        });

      const newInvestment = await tx
        .insert(Investment)
        .values({
          symbol: symbol.toUpperCase(),
          shares: sharesValue,
          purchasePrice: purchasePriceValue,
          purchaseDate: purchaseDateValue,
          account: investmentAccountId,
          investedAmount: investedAmountValue,
          createdAt: new Date(),
        })
        .returning()
        .catch((err) => {
          throw new HTTPException(500, { message: `DB Insert Investment Error: ${err.message}` });
        });
      if (!newInvestment || newInvestment.length === 0)
        throw new HTTPException(500, { message: 'Failed to create investment record.' });

      return newInvestment[0];
    });
    return { message: 'Investment created and account balance updated successfully', data: result };
  }
}

export const investmentService = new InvestmentService();

// Helper for weekend check (keep here or move to date.utils.ts)
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}
