import apiFetch from '../api-client';
import { InvestmentAccount, Pagination, ApiResponse, InvestmentAccountSummary } from '../types';

export const investmentAccountCreate = (body: any) =>
  apiFetch('/investmentAccount', 'POST', body, undefined);

export const investmentAccountGetAll = (
  params: any
): Promise<ApiResponse<{ data: InvestmentAccount[]; pagination: Pagination }>> =>
  apiFetch('/investmentAccount/all', 'GET', undefined, { params });

export const investmentAccountUpdate = (id: string, body: any) =>
  apiFetch(`/investmentAccount/${id}`, 'PUT', body, undefined);

export const investmentAccountDelete = (id: string) =>
  apiFetch(`/investmentAccount/${id}`, 'DELETE');

export const investmentAccountGetById = (id: string): Promise<ApiResponse<InvestmentAccount>> =>
  apiFetch(`/investmentAccount/${id}`, 'GET', undefined, undefined);

export const investmentAccountGetSummary = (
  id: string
): Promise<ApiResponse<InvestmentAccountSummary>> =>
  apiFetch(`/investmentAccount/${id}/summary`, 'GET');
