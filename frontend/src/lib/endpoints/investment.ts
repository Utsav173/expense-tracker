import apiFetch from '../api-client';
import {
  Investment,
  ApiResponse,
  PortfolioSummary,
  Pagination,
  StockSearchResult,
  StockPriceResult,
  HistoricalStockPriceResponse
} from '../types';

export const investmentCreate = (
  body: any
): Promise<ApiResponse<{ message: string; data: Investment }>> =>
  apiFetch('/investment', 'POST', body);

export const investmentGetAll = (
  accountId: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ApiResponse<{ data: Investment[]; pagination: Pagination }>> =>
  apiFetch(`/investment/${accountId}`, 'GET', undefined, { params });

export const investmentUpdate = (
  id: string,
  body: any
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(`/investment/${id}`, 'PUT', body);

export const investmentDelete = (id: string): Promise<ApiResponse<{ message: string }>> =>
  apiFetch(`/investment/${id}`, 'DELETE');

export const investmentGetDetails = (id: string): Promise<ApiResponse<Investment>> =>
  apiFetch(`/investment/details/${id}`, 'GET');

export const investmentUpdateDividend = (
  id: string,
  body: { dividend: number }
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(`/investment/${id}/update-dividend`, 'PUT', body);

export const investmentStockSearch = (params: {
  q: string;
}): Promise<ApiResponse<StockSearchResult[]>> =>
  apiFetch('/investment/stocks/search', 'GET', undefined, { params });

export const investmentStockPrice = (symbol: string): Promise<ApiResponse<StockPriceResult>> =>
  apiFetch(`/investment/stocks/price/${symbol}`, 'GET');

export const investmentStockHistoricalPrice = (
  symbol: string,
  date: string
): Promise<ApiResponse<HistoricalStockPriceResponse | null>> =>
  apiFetch(`/investment/stocks/historical-price/${symbol}?date=${date}`, 'GET');

export const investmentGetPortfolioSummary = (): Promise<ApiResponse<PortfolioSummary>> =>
  apiFetch('/investment/portfolio-summary', 'GET');

export const investmentGetPortfolioHistorical = (
  params: {
    period?: '7d' | '30d' | '90d' | '1y';
    startDate?: string;
    endDate?: string;
  } = { period: '30d' }
): Promise<
  ApiResponse<{
    data: { date: string; value: number }[];
    currency: string;
    valueIsEstimate: boolean;
  }>
> => apiFetch('/investment/portfolio-historical', 'GET', undefined, { params });

export const investmentGetOldestDate = (): Promise<ApiResponse<{ oldestDate: string | null }>> =>
  apiFetch('/investment/oldest-date', 'GET');
