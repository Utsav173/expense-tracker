import { tool } from 'ai';
import { z } from 'zod';
import { DateRange, parseNaturalLanguageDateRange } from '../../utils/nl_date.utils';
import { createErrorResponse, createToolResponse } from './shared';
import {
  financeService,
  StockSearchResult,
  StockPriceResult,
  HistoricalPriceResult,
} from '../../services/finance.service';
import { HTTPException } from 'hono/http-exception';
import { format as formatDateFn, isEqual, startOfDay } from 'date-fns';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const stockPriceCache = new Map<string, CacheEntry<StockPriceResult>>();
const STOCK_PRICE_CACHE_TTL_MS = 1 * 60 * 1000;

export function createExternalTools() {
  return {
    parseNaturalLanguageDateRange: tool({
      description:
        "Parses a natural language date description (e.g., 'this month', 'last quarter', 'next week', 'January 2023', 'yesterday', 'from March 1 to April 10 2023') into a start and end date in YYYY-MM-DD format. Uses current date as reference automatically.",
      parameters: z.object({
        dateDescription: z
          .string()
          .min(1)
          .describe(
            "A description of the date range to parse (e.g., 'next week', 'January 2022', 'last Tuesday', 'between 1st and 15th of last month').",
          ),
      }),
      execute: async ({ dateDescription }) => {
        try {
          const parsedDateRange: DateRange | null = parseNaturalLanguageDateRange(dateDescription);

          if (!parsedDateRange || !parsedDateRange.startDate || !parsedDateRange.endDate) {
            return createToolResponse({
              success: false,
              error: `Could not parse a valid date range from "${dateDescription}". Please try a clearer description (e.g., 'last month', 'this year', 'June 2023', 'from 2023-01-01 to 2023-01-15').`,
            });
          }

          const formattedRange = {
            startDate: formatDateFn(parsedDateRange.startDate, 'yyyy-MM-dd'),
            endDate: formatDateFn(parsedDateRange.endDate, 'yyyy-MM-dd'),
          };

          return createToolResponse({
            success: true,
            message: `Parsed date range from "${dateDescription}" as ${formattedRange.startDate} to ${formattedRange.endDate}.`,
            data: formattedRange,
          });
        } catch (error) {
          return createErrorResponse(
            error,
            `Failed to parse date range from "${dateDescription}".`,
          );
        }
      },
    }),

    searchStockSymbols: tool({
      description:
        'Searches for stock symbols based on a company name or partial symbol. Returns up to 10 matches.',
      parameters: z.object({
        query: z
          .string()
          .min(1)
          .describe('The search term (e.g., "Apple", "Tesla", "TCS", "RELIANCE.NS").'),
      }),
      execute: async ({ query }) => {
        try {
          const results: StockSearchResult[] = await financeService.searchStocks(query);
          if (results.length === 0) {
            return createToolResponse({
              success: true,
              message: `No stock symbols found matching "${query}". Please check the spelling or try a broader term.`,
              data: [],
            });
          }
          return createToolResponse({
            success: true,
            message: `Found ${results.length} stock symbol(s) matching "${query}". The most relevant is usually listed first.`,
            data: results,
          });
        } catch (error) {
          return createErrorResponse(
            error,
            `Failed to search for stock symbols matching "${query}". The finance service might be temporarily unavailable.`,
          );
        }
      },
    }),

    getCurrentStockPrice: tool({
      description:
        "Gets the *latest* available stock price, daily change, and other market data for a specific stock symbol. Does not accept dates. If you found stock symbols are incorrect, use 'searchStockSymbols' tool to get correct stock symbol first.",
      parameters: z.object({
        symbol: z
          .string()
          .min(1)
          .describe(
            'The stock symbol to fetch the *current* price for (e.g., "AAPL", "GOOGL", "TSLA", "RELIANCE.NS").',
          ),
      }),
      execute: async ({ symbol }) => {
        const upperSymbol = symbol.toUpperCase();
        const cachedEntry = stockPriceCache.get(upperSymbol);
        if (cachedEntry && cachedEntry.expiry > Date.now()) {
          return createToolResponse({
            success: true,
            message: `Current stock price data (cached) retrieved for ${upperSymbol}.`,
            data: cachedEntry.data,
          });
        }

        try {
          const priceData: StockPriceResult = await financeService.getCurrentStockPrice(symbol);
          stockPriceCache.set(upperSymbol, {
            data: priceData,
            expiry: Date.now() + STOCK_PRICE_CACHE_TTL_MS,
          });
          return createToolResponse({
            success: true,
            message: `Current stock price data retrieved for ${upperSymbol}.`,
            data: priceData,
          });
        } catch (error) {
          if (error instanceof HTTPException && error.status === 404) {
            return createToolResponse({
              success: false,
              error: `Could not find current price data for symbol '${upperSymbol}'. It might be an invalid symbol, or data is temporarily unavailable from the finance service.`,
            });
          }
          return createErrorResponse(
            error,
            `Failed to get current stock price for ${upperSymbol}. The finance service might be down.`,
          );
        }
      },
    }),

    getHistoricalStockPriceOnDate: tool({
      description:
        'Gets the historical closing stock price for a specific symbol on a specific date. Accepts YYYY-MM-DD format or natural language descriptions like "yesterday", "last Tuesday". If the symbol is uncertain, use "searchStockSymbols" first.',
      parameters: z.object({
        symbol: z
          .string()
          .min(1)
          .describe('The stock symbol (e.g., "AAPL", "MSFT", "RELIANCE.NS").'),
        dateDescription: z
          .string()
          .min(1)
          .describe(
            'The specific date or natural language description for the historical price (e.g., "2023-10-26", "yesterday", "last Friday", "January 15 2023").',
          ),
      }),
      execute: async ({ symbol, dateDescription }) => {
        let targetDateStr: string;

        const searchResults = await financeService.searchStocks(symbol);
        if (searchResults.length === 0) {
          return createToolResponse({
            success: false,
            error: `No stock symbols found matching "${symbol}". Please provide a valid symbol. You can use 'searchStockSymbols' to find one.`,
            data: [],
          });
        }
        const resolvedSymbol = searchResults[0].symbol;

        try {
          const parsedRange = parseNaturalLanguageDateRange(dateDescription);
          if (!parsedRange || !parsedRange.startDate) {
            return createToolResponse({
              success: false,
              error: `Could not understand the date "${dateDescription}". Please use YYYY-MM-DD format or a clearer description (e.g., "yesterday", "last Monday", "Jan 15 2023").`,
            });
          }
          if (
            parsedRange.endDate &&
            !isEqual(startOfDay(parsedRange.startDate), startOfDay(parsedRange.endDate))
          ) {
            return createToolResponse({
              success: false,
              error: `The date description "${dateDescription}" resolved to a date range. This tool requires a single specific date. Try 'getHistoricalStockPriceRange' or rephrase for one day.`,
            });
          }
          targetDateStr = formatDateFn(parsedRange.startDate, 'yyyy-MM-dd');
        } catch (parseError) {
          console.error(`Error parsing date description "${dateDescription}" in tool:`, parseError);
          return createErrorResponse(parseError, `Failed to parse the date "${dateDescription}".`);
        }

        try {
          const historicalData: HistoricalPriceResult =
            await financeService.getHistoricalStockPrice(resolvedSymbol, targetDateStr);
          return createToolResponse({
            success: true,
            message: `Historical stock price for ${resolvedSymbol.toUpperCase()} on ${targetDateStr} (parsed from "${dateDescription}") retrieved.`,
            data: historicalData,
          });
        } catch (error) {
          if (error instanceof HTTPException && error.status === 404) {
            return createToolResponse({
              success: false,
              error: `No historical data found for symbol '${resolvedSymbol.toUpperCase()}' on ${targetDateStr}. The market might have been closed, the date might be too recent/old, or the symbol is invalid.`,
            });
          }
          return createErrorResponse(
            error,
            `Failed to get historical stock price for ${resolvedSymbol.toUpperCase()} on ${targetDateStr}. Finance service might be unavailable.`,
          );
        }
      },
    }),

    getHistoricalStockPriceRange: tool({
      description:
        'Gets the historical daily closing stock prices for a specific symbol over a given date range. Requires specific start and end dates in YYYY-MM-DD format. If the symbol is uncertain, use "searchStockSymbols" first.',
      parameters: z.object({
        symbol: z
          .string()
          .min(1)
          .describe('The stock symbol (e.g., "AAPL", "GOOGL", "RELIANCE.NS").'),
        startDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
          .describe('The start date of the range in YYYY-MM-DD format (inclusive).'),
        endDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
          .describe('The end date of the range in YYYY-MM-DD format (inclusive).'),
      }),
      execute: async ({ symbol, startDate, endDate }) => {
        try {
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          startDateObj.setUTCHours(0, 0, 0, 0);
          endDateObj.setUTCHours(0, 0, 0, 0);

          if (isNaN(startDateObj.getTime()))
            return createToolResponse({
              success: false,
              error: `Invalid start date format: "${startDate}". Use YYYY-MM-DD.`,
            });
          if (isNaN(endDateObj.getTime()))
            return createToolResponse({
              success: false,
              error: `Invalid end date format: "${endDate}". Use YYYY-MM-DD.`,
            });
          if (startOfDay(startDateObj) > startOfDay(endDateObj))
            return createToolResponse({
              success: false,
              error: `Start date (${startDate}) cannot be after end date (${endDate}).`,
            });

          const priceMap: Map<string, number | null> =
            await financeService.fetchHistoricalPricesForSymbol(symbol, startDateObj, endDateObj);
          const resultsArray = Array.from(priceMap.entries())
            .map(([date, price]) => ({ date, price }))
            .sort((a, b) => a.date.localeCompare(b.date));

          if (resultsArray.length === 0) {
            return createToolResponse({
              success: true,
              message: `No historical data points found for ${symbol.toUpperCase()} between ${startDate} and ${endDate}. Markets might have been closed or data unavailable.`,
              data: [],
            });
          }
          return createToolResponse({
            success: true,
            message: `Historical daily closing prices retrieved for ${symbol.toUpperCase()} from ${startDate} to ${endDate}.`,
            data: resultsArray,
          });
        } catch (error) {
          if (error instanceof HTTPException && error.status === 404) {
            return createToolResponse({
              success: false,
              error: `Could not retrieve data for symbol '${symbol.toUpperCase()}' in the range ${startDate} to ${endDate}. The symbol might be invalid or no data exists for this period.`,
            });
          }
          return createErrorResponse(
            error,
            `Failed to get historical stock price range for ${symbol.toUpperCase()} from ${startDate} to ${endDate}. Finance service error.`,
          );
        }
      },
    }),
  };
}
