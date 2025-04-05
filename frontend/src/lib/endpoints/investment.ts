import apiFetch from '../api-client';
import {
  Investment,
  ApiResponse,
  PortfolioItem,
  PortfolioSummary,
  Pagination,
  StockSearchResult,
  StockPriceResult
} from '../types';

export const investmentCreate = (
  body: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string; data: Investment }>> =>
  apiFetch('/investment', 'POST', body, undefined, successMessage, errorMessage);

export const investmentGetAll = (
  accountId: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ data: Investment[]; pagination: Pagination }>> =>
  apiFetch(`/investment/${accountId}`, 'GET', undefined, { params }, successMessage, errorMessage);

export const investmentUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(`/investment/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const investmentDelete = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string }>> =>
  apiFetch(`/investment/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const investmentGetDetails = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<Investment>> =>
  apiFetch(`/investment/details/${id}`, 'GET', undefined, undefined, successMessage, errorMessage);

export const investmentUpdateDividend = (
  id: string,
  body: { dividend: number },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(
    `/investment/${id}/update-divident`,
    'PUT',
    body,
    undefined,
    successMessage,
    errorMessage
  );

export const investmentGetPortfolio = (
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<PortfolioItem[]>> =>
  apiFetch('/investment/portfolio', 'GET', undefined, undefined, successMessage, errorMessage);

export const investmentStockSearch = (
  params: { q: string },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<StockSearchResult[]>> =>
  apiFetch('/investment/stocks/search', 'GET', undefined, { params }, successMessage, errorMessage);

export const investmentStockPrice = (
  symbol: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<StockPriceResult>> =>
  apiFetch(
    `/investment/stocks/price/${symbol}`,
    'GET',
    undefined,
    undefined,
    successMessage,
    errorMessage
  );

export const investmentGetPortfolioSummary = (
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<PortfolioSummary>> =>
  apiFetch(
    '/investment/portfolio-summary',
    'GET',
    undefined,
    undefined,
    successMessage,
    errorMessage || 'Failed to fetch portfolio summary'
  );

export const investmentStockHistoricalPrice = (
  symbol: string,
  date: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ price: number | null }>> =>
  apiFetch(
    `/investment/stocks/historical/${symbol}?date=${date}`,
    'GET',
    undefined,
    undefined,
    successMessage,
    errorMessage || 'Failed to fetch historical price'
  );
