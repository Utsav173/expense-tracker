import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { InvestmentAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type CreateInvestmentBody = z.infer<typeof apiEndpoints.investment.create.body>;
type UpdateInvestmentBody = z.infer<typeof apiEndpoints.investment.update.body>;
type UpdateDividendBody = z.infer<typeof apiEndpoints.investment.updateDividend.body>;
type GetAllParams = z.infer<typeof apiEndpoints.investment.getAllForAccount.query>;
type SearchParams = z.infer<typeof apiEndpoints.investment.searchStocks.query>;
type HistoricalParams = z.infer<typeof apiEndpoints.investment.getHistoricalPortfolio.query>;

export const investmentCreate = (
  body: CreateInvestmentBody
): Promise<InvestmentAPI.CreateInvestmentResponse> =>
  apiClient(apiEndpoints.investment.create, { body });

export const investmentGetAll = (
  accountId: string,
  params: GetAllParams
): Promise<InvestmentAPI.GetInvestmentsForAccountResponse> =>
  apiClient(apiEndpoints.investment.getAllForAccount, { params: { accountId }, query: params });

export const investmentUpdate = (
  id: string,
  body: UpdateInvestmentBody
): Promise<InvestmentAPI.UpdateInvestmentResponse> =>
  apiClient(apiEndpoints.investment.update, { params: { id }, body });

export const investmentDelete = (id: string): Promise<InvestmentAPI.DeleteInvestmentResponse> =>
  apiClient(apiEndpoints.investment.delete, { params: { id } });

export const investmentGetDetails = (id: string): Promise<InvestmentAPI.GetDetailsResponse> =>
  apiClient(apiEndpoints.investment.getDetails, { params: { id } });

export const investmentGetPerformance = (
  id: string
): Promise<InvestmentAPI.GetPerformanceResponse> =>
  apiClient(apiEndpoints.investment.getPerformance, { params: { id } });

export const investmentUpdateDividend = (
  id: string,
  body: UpdateDividendBody
): Promise<InvestmentAPI.UpdateDividendResponse> =>
  apiClient(apiEndpoints.investment.updateDividend, { params: { id }, body });

export const investmentStockSearch = (
  params: SearchParams
): Promise<InvestmentAPI.SearchStocksResponse> =>
  apiClient(apiEndpoints.investment.searchStocks, { query: params });

export const investmentStockPrice = (
  symbol: string
): Promise<InvestmentAPI.GetStockPriceResponse> =>
  apiClient(apiEndpoints.investment.getStockPrice, { params: { symbol } });

export const investmentStockHistoricalPrice = (
  symbol: string,
  date: string
): Promise<InvestmentAPI.GetHistoricalStockPriceResponse | null> =>
  apiClient(apiEndpoints.investment.getHistoricalStockPrice, {
    params: { symbol },
    query: { date }
  });

export const investmentGetPortfolioSummary =
  (): Promise<InvestmentAPI.GetPortfolioSummaryResponse> =>
    apiClient(apiEndpoints.investment.getPortfolioSummary);

export const investmentGetPortfolioHistorical = (
  params: HistoricalParams = { period: '30d' }
): Promise<InvestmentAPI.GetHistoricalPortfolioResponse> =>
  apiClient(apiEndpoints.investment.getHistoricalPortfolio, { query: params });

export const investmentGetOldestDate = (): Promise<InvestmentAPI.GetOldestDateResponse> =>
  apiClient(apiEndpoints.investment.getOldestDate);
