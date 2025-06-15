import apiFetch from '../api-client';
import { Transaction, ApiResponse, IncomeExpenseChartData, TransactionsResponse } from '../types';

export const transactionCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/transactions', 'POST', body, undefined, successMessage, errorMessage);

export const transactionGetAll = (
  params: any,
  successMessage?: string,
  errorMessage?: string
): Promise<TransactionsResponse> =>
  apiFetch(`/transactions`, 'GET', undefined, { params }, successMessage, errorMessage);

export const transactionGetById = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<Transaction>> =>
  apiFetch(`/transactions/${id}`, 'GET', undefined, undefined, successMessage, errorMessage);

export const transactionGetRecurringAll = (
  params: any,
  successMessage?: string,
  errorMessage?: string
) =>
  apiFetch('/transactions/recurring', 'GET', undefined, { params }, successMessage, errorMessage);

export const transactionGetRecurringById = (
  id: string,
  successMessage?: string,
  errorMessage?: string
) =>
  apiFetch(
    `/transactions/recurring/${id}`,
    'GET',
    undefined,
    undefined,
    successMessage,
    errorMessage
  );

export const transactionUpdateRecurring = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
) =>
  apiFetch(`/transactions/recurring/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const transactionDeleteRecurring = (
  id: string,
  successMessage?: string,
  errorMessage?: string
) =>
  apiFetch(
    `/transactions/recurring/${id}`,
    'DELETE',
    undefined,
    undefined,
    successMessage,
    errorMessage
  );

export const transactionSkipRecurring = (
  id: string,
  successMessage?: string,
  errorMessage?: string
) =>
  apiFetch(
    `/transactions/recurring/${id}/skip`,
    'POST',
    undefined,
    undefined,
    successMessage,
    errorMessage
  );

export const transactionUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
) => apiFetch(`/transactions/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const transactionDelete = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/transactions/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const transactionGetIncomeExpenseChart = (params: {
  accountId?: string;
  duration: string;
}): Promise<ApiResponse<IncomeExpenseChartData>> =>
  apiFetch(
    '/transactions/by/income/expense/chart',
    'GET',
    undefined,
    { params },
    undefined,
    undefined
  );

export const transactionGetCategoryChart = (
  params: { duration: string; accountId?: string },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ name: string[]; totalIncome: number[]; totalExpense: number[] }>> =>
  apiFetch(
    '/transactions/by/category/chart',
    'GET',
    undefined,
    { params },
    successMessage,
    errorMessage || 'Failed to get category chart data'
  );
