import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { InvestmentAccountAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type CreateAccountBody = z.infer<typeof apiEndpoints.investmentAccount.create.body>;
type UpdateAccountBody = z.infer<typeof apiEndpoints.investmentAccount.update.body>;
type GetAllParams = z.infer<typeof apiEndpoints.investmentAccount.getAll.query>;
type PerformanceParams = z.infer<typeof apiEndpoints.investmentAccount.getPerformance.query>;

export const investmentAccountCreate = (body: CreateAccountBody) =>
  apiClient<unknown, unknown, CreateAccountBody, InvestmentAccountAPI.CreateResponse>(
    apiEndpoints.investmentAccount.create,
    { body }
  );

export const investmentAccountGetAll = (
  params: GetAllParams
): Promise<InvestmentAccountAPI.GetInvestmentAccountsResponse> =>
  apiClient(apiEndpoints.investmentAccount.getAll, { query: params });

export const investmentAccountUpdate = (id: string, body: UpdateAccountBody) =>
  apiClient<{ id: string }, unknown, UpdateAccountBody, InvestmentAccountAPI.UpdateResponse>(
    apiEndpoints.investmentAccount.update,
    { params: { id }, body }
  );

export const investmentAccountDelete = (id: string) =>
  apiClient<{ id: string }, unknown, unknown, InvestmentAccountAPI.DeleteResponse>(
    apiEndpoints.investmentAccount.delete,
    { params: { id } }
  );

export const investmentAccountGetById = (
  id: string
): Promise<InvestmentAccountAPI.GetByIdResponse> =>
  apiClient(apiEndpoints.investmentAccount.getById, { params: { id } });

export const investmentAccountGetSummary = (
  id: string
): Promise<InvestmentAccountAPI.GetSummaryResponse> =>
  apiClient(apiEndpoints.investmentAccount.getSummary, { params: { id } });

export const investmentAccountGetPerformance = (
  accountId: string,
  params?: PerformanceParams
): Promise<InvestmentAccountAPI.GetPerformanceResponse> =>
  apiClient(apiEndpoints.investmentAccount.getPerformance, {
    params: { id: accountId },
    query: params
  });
