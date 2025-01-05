import apiFetch from '../api-client';
import { Transaction, ApiResponse } from '../types';

type TransactionsResponse = ApiResponse<{
  transactions: Transaction[];
  totalPages: number;
}>;
export const transactionCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/transactions', 'POST', body, undefined, successMessage, errorMessage);

export const transactionGetAll = (
  params: any,
  successMessage?: string,
  errorMessage?: string,
): Promise<TransactionsResponse> => // explicitly set generic types to data from axios
  apiFetch(`/transactions`, 'GET', undefined, { params }, successMessage, errorMessage);

export const transactionGetById = (
  id: string,
  successMessage?: string,
  errorMessage?: string,
): Promise<ApiResponse<Transaction>> => // explicitly type
  apiFetch(`/transactions/${id}`, 'GET', undefined, undefined, successMessage, errorMessage);

export const transactionGetRecurringAll = (
  params: any,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch('/transactions/recurring', 'GET', undefined, { params }, successMessage, errorMessage);

export const transactionGetRecurringById = (
  id: string,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch(
    `/transactions/recurring/${id}`,
    'GET',
    undefined,
    undefined,
    successMessage,
    errorMessage,
  );

export const transactionUpdateRecurring = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch(`/transactions/recurring/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const transactionDeleteRecurring = (
  id: string,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch(
    `/transactions/recurring/${id}`,
    'DELETE',
    undefined,
    undefined,
    successMessage,
    errorMessage,
  );

export const transactionSkipRecurring = (
  id: string,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch(
    `/transactions/recurring/${id}/skip`,
    'POST',
    undefined,
    undefined,
    successMessage,
    errorMessage,
  );
