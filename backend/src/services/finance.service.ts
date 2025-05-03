// src/services/finance.service.ts
import { HTTPException } from 'hono/http-exception';
import { format as formatDateFn } from 'date-fns';

// Define types for API responses for better clarity
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
  previousClose?: number; // Sometimes used instead of chartPreviousClose
  scale?: number;
  priceHint?: number;
  currentTradingPeriod?: any; // Define further if needed
  tradingPeriods?: any; // Define further if needed
  dataGranularity?: string;
  range?: string;
  validRanges?: string[];
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  longName?: string; // Added for company name
  shortName?: string; // Added for company name
  marketState?: string; // Added market state
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
  // Other potential fields like news, explains, etc.
};

// Define return types for service methods
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
  date: string; // YYYY-MM-DD
  price: number | null; // Closing price, can be null
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
        } catch (_) {
          /* ignore */
        }
        // Handle Yahoo's "Data doesn't exist for startDate..." as 404
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
        // Throw specific errors based on status code
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
      if (error instanceof HTTPException) throw error; // Re-throw known HTTP exceptions
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
      return []; // Return empty array if no quotes found or format is wrong
    }

    return data.quotes
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || 'N/A',
        exchange: quote.exchange || 'N/A',
        type: quote.quoteType || 'N/A',
      }))
      .filter((q) => q.symbol); // Ensure symbol exists
  }

  async getCurrentStockPrice(symbol: string): Promise<StockPriceResult> {
    if (!symbol) throw new HTTPException(400, { message: 'Symbol is required' });

    // Fetch minimal data needed: 1 day range, 1 minute interval is often used for current price
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
    const prevClose = meta.previousClose ?? meta.chartPreviousClose; // Check both possible fields
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
      period2EndDate.setDate(period2EndDate.getDate() + 1); // Add buffer day for Yahoo query
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

        // Ensure the date is within the *requested* range (inclusive)
        if (currentDateOnly >= startDate && currentDateOnly <= effectiveEndDate) {
          priceMap.set(dateString, closePrices[i] ?? null); // Store price or null
        }
      }
    } catch (err) {
      // Log error but don't necessarily throw from utility, allow partial data return
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

    // Fetch data for a small range around the date to handle non-trading days potentially
    const startDate = new Date(requestedDate);
    startDate.setDate(startDate.getDate() - 3); // Look back a few days
    const endDate = new Date(requestedDate);
    endDate.setDate(endDate.getDate() + 1); // Look forward one day

    const priceMap = await this.fetchHistoricalPricesForSymbol(symbol, startDate, endDate);
    const priceOnDate = priceMap.get(dateStr); // Get price for the specific requested date

    if (priceOnDate === undefined) {
      // Check if the date exists in the map
      throw new HTTPException(404, {
        message: `No historical data available for '${symbol}' on ${dateStr}. Market might have been closed.`,
      });
    }

    // Fetch metadata separately (optional, could combine if API allows)
    // For simplicity, we'll use the current price fetch for metadata, acknowledging it might slightly differ
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
      price: priceOnDate, // Price for the specific day (can be null)
      currency: meta?.currency || 'N/A',
      exchange: meta?.exchangeName || 'N/A',
      companyName: meta?.longName || meta?.shortName || 'N/A',
      // Note: Open, High, Low, Volume are not directly available from the map, would need modification to fetchHistoricalPricesForSymbol if required
    };
  }
}

// Export a singleton instance
export const financeService = new FinanceService();
