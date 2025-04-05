import apiFetch from '../api-client';
import { InvestmentAccount, Pagination, ApiResponse, InvestmentAccountSummary } from '../types';

export const investmentAccountCreate = (
  body: any,
  successMessage?: string,
  errorMessage?: string
) => apiFetch('/investmentAccount', 'POST', body, undefined, successMessage, errorMessage);

export const investmentAccountGetAll = (
  params: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ data: InvestmentAccount[]; pagination: Pagination }>> =>
  apiFetch('/investmentAccount/all', 'GET', undefined, { params }, successMessage, errorMessage);

export const investmentAccountUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
) => apiFetch(`/investmentAccount/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const investmentAccountDelete = (
  id: string,
  successMessage?: string,
  errorMessage?: string
) =>
  apiFetch(
    `/investmentAccount/${id}`,
    'DELETE',
    undefined,
    undefined,
    successMessage,
    errorMessage
  );

export const investmentAccountGetById = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<InvestmentAccount>> =>
  apiFetch(`/investmentAccount/${id}`, 'GET', undefined, undefined, successMessage, errorMessage);

export const investmentAccountGetSummary = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<InvestmentAccountSummary>> =>
  apiFetch(
    `/investmentAccount/${id}/summary`,
    'GET',
    undefined,
    undefined,
    successMessage,
    errorMessage
  );
