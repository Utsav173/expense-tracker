import { HTTPException } from 'hono/http-exception';
import { format as formatDateFn } from 'date-fns';

type YahooChartMeta = {
  currency?: string;
  symbol?: string;
  exchangeName?: string;
  instrumentType?: string;
  firstTradeDate?: number;
  regularMarketTime?: number;
  gmtoffset?: number;
  timezone?: string;
  exchangeTimezoneName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  scale?: number;
  priceHint?: number;
  currentTradingPeriod?: any;
  tradingPeriods?: any;
  dataGranularity?: string;
  range?: string;
  validRanges?: string[];
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  longName?: string;
  shortName?: string;
  marketState?: string;
};

type YahooChartQuote = {
  close?: (number | null)[];
  open?: (number | null)[];
  high?: (number | null)[];
  low?: (number | null)[];
  volume?: (number | null)[];
};

type YahooChartResult = {
  meta: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: YahooChartQuote[];
    adjclose?: { adjclose?: (number | null)[] }[];
  };
};

type YahooChartResponse = {
  chart?: {
    result?: YahooChartResult[];
    error?: any;
  };
};

type YahooSearchResultQuote = {
  exchange: string;
  shortname?: string;
  quoteType: string;
  symbol: string;
  index: string;
  score: number;
  typeDisp: string;
  longname?: string;
  isYahooFinance: boolean;
};

type YahooSearchResponse = {
  quotes: YahooSearchResultQuote[];
};

export type StockSearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};

export type StockPriceResult = {
  symbol: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  exchange: string;
  currency: string;
  companyName: string;
  marketState: string;
  regularMarketTime: string | null;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
};

export type HistoricalPriceResult = {
  symbol: string;
  date: string;
  price: number | null;
  currency: string;
  exchange: string;
  companyName: string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
};

export class FinanceService {
  private yahooBaseUrl_Chart = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private yahooBaseUrl_Search = 'https://query1.finance.yahoo.com/v1/finance/search';

  private async fetchYahoo(url: string, symbolForLogging: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorBody = `Yahoo API Error (${response.status})`;
        let errorJson: any = null;
        try {
          errorBody = await response.text();
          errorJson = JSON.parse(errorBody);
        } catch (_) {}

        if (
          response.status === 400 &&
          errorJson?.chart?.error?.description?.includes("Data doesn't exist for startDate")
        ) {
          throw new HTTPException(404, {
            message: `No historical data available for symbol '${symbolForLogging}' in the requested date range.`,
          });
        }
        console.error(
          `Yahoo API Error (${response.status}) for ${symbolForLogging}: ${errorBody.substring(
            0,
            500,
          )}`,
        );

        if (response.status === 404) {
          throw new HTTPException(404, {
            message: `Data not found for symbol '${symbolForLogging}' on Yahoo Finance.`,
          });
        } else {
          throw new HTTPException(502, {
            message: `Failed to fetch data for ${symbolForLogging}. Provider status: ${response.status}.`,
          });
        }
      }
      return await response.json();
    } catch (error: any) {
      if (error instanceof HTTPException) throw error;
      console.error(`Network or parsing error fetching from Yahoo for ${symbolForLogging}:`, error);
      throw new HTTPException(503, {
        message: `Could not connect to finance data provider: ${error.message}`,
      });
    }
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new HTTPException(400, { message: 'Search query cannot be empty.' });
    }
    const url = `${this.yahooBaseUrl_Search}?q=${encodeURIComponent(
      query,
    )}&quotesCount=10&lang=en-US`;

    const data: YahooSearchResponse = await this.fetchYahoo(url, `search: ${query}`);

    if (!data.quotes || !Array.isArray(data.quotes)) {
      console.warn('Yahoo Search API returned unexpected format:', data);
      return [];
    }

    return data.quotes
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || 'N/A',
        exchange: quote.exchange || 'N/A',
        type: quote.quoteType || 'N/A',
      }))
      .filter((q) => q.symbol);
  }

  async getCurrentStockPrice(symbol: string): Promise<StockPriceResult> {
    if (!symbol) throw new HTTPException(400, { message: 'Symbol is required' });

    const url = `${this.yahooBaseUrl_Chart}/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
    const data: YahooChartResponse = await this.fetchYahoo(url, symbol);

    const result = data.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      throw new HTTPException(404, {
        message: `Current price data unavailable for '${symbol}'. Market might be closed or symbol invalid.`,
      });
    }

    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose;
    let change = null;
    let changePercent = null;

    if (typeof prevClose === 'number' && prevClose !== 0) {
      change = price - prevClose;
      changePercent = (change / prevClose) * 100;
    }

    return {
      symbol: symbol.toUpperCase(),
      price: price,
      change: change ? parseFloat(change.toFixed(2)) : null,
      changePercent: changePercent ? parseFloat(changePercent.toFixed(2)) : null,
      exchange: meta.exchangeName || 'N/A',
      currency: meta.currency || 'N/A',
      companyName: meta.longName || meta.shortName || 'N/A',
      marketState: meta.marketState || 'N/A',
      regularMarketTime: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      regularMarketDayHigh: meta.regularMarketDayHigh,
      regularMarketDayLow: meta.regularMarketDayLow,
      regularMarketVolume: meta.regularMarketVolume,
    };
  }

  async fetchHistoricalPricesForSymbol(
    symbol: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, number | null>> {
    const priceMap = new Map<string, number | null>();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const effectiveEndDate = endDate > now ? now : endDate;
    if (startDate > effectiveEndDate) {
      console.warn(
        `fetchHistoricalPrices: Start date ${formatDateFn(
          startDate,
          'yyyy-MM-dd',
        )} is after end date ${formatDateFn(effectiveEndDate, 'yyyy-MM-dd')} for ${symbol}.`,
      );
      return priceMap;
    }

    try {
      const period1 = Math.floor(startDate.getTime() / 1000);
      const period2EndDate = new Date(effectiveEndDate);
      period2EndDate.setDate(period2EndDate.getDate() + 1);
      const period2 = Math.floor(period2EndDate.getTime() / 1000);

      const url = `${this.yahooBaseUrl_Chart}/${encodeURIComponent(
        symbol,
      )}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
      const data: YahooChartResponse = await this.fetchYahoo(url, `${symbol} historical`);

      const result = data.chart?.result?.[0];
      if (!result?.timestamp || !result.indicators?.quote?.[0]?.close) {
        console.warn(
          `No valid historical data structure from Yahoo for ${symbol} in range [${formatDateFn(
            startDate,
            'yyyy-MM-dd',
          )} - ${formatDateFn(effectiveEndDate, 'yyyy-MM-dd')}].`,
        );
        return priceMap;
      }

      const timestamps: number[] = result.timestamp;
      const closePrices: (number | null)[] = result.indicators.quote[0].close;

      for (let i = 0; i < timestamps.length; i++) {
        const date = new Date(timestamps[i] * 1000);
        const dateString = formatDateFn(date, 'yyyy-MM-dd');
        const currentDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (currentDateOnly >= startDate && currentDateOnly <= effectiveEndDate) {
          priceMap.set(dateString, closePrices[i] ?? null);
        }
      }
    } catch (err) {
      console.error(
        `Failed to fetch historical data range for ${symbol}:`,
        err instanceof Error ? err.message : err,
      );
    }
    return priceMap;
  }

  async getHistoricalStockPrice(symbol: string, dateStr: string): Promise<HistoricalPriceResult> {
    const requestedDate = new Date(dateStr);
    if (isNaN(requestedDate.getTime()))
      throw new HTTPException(400, { message: 'Invalid date format. Use YYYY-MM-DD.' });

    const startDate = new Date(requestedDate);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(requestedDate);
    endDate.setDate(endDate.getDate() + 1);

    const priceMap = await this.fetchHistoricalPricesForSymbol(symbol, startDate, endDate);
    const priceOnDate = priceMap.get(dateStr);

    if (priceOnDate === undefined) {
      throw new HTTPException(404, {
        message: `No historical data available for '${symbol}' on ${dateStr}. Market might have been closed.`,
      });
    }

    let meta: YahooChartMeta = {};
    try {
      const currentPriceData = await this.fetchYahoo(
        `${this.yahooBaseUrl_Chart}/${encodeURIComponent(symbol)}?interval=1m&range=1d`,
        `${symbol} metadata`,
      );
      meta = currentPriceData.chart?.result?.[0]?.meta ?? {};
    } catch (metaError) {
      console.warn(
        `Could not fetch current metadata for ${symbol} while getting historical price:`,
        metaError,
      );
    }

    return {
      symbol: symbol.toUpperCase(),
      date: dateStr,
      price: priceOnDate,
      currency: meta?.currency || 'N/A',
      exchange: meta?.exchangeName || 'N/A',
      companyName: meta?.longName || meta?.shortName || 'N/A',
    };
  }
}

export const financeService = new FinanceService();
