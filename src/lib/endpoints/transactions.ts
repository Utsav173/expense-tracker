import apiFetch from '../api-client';
import {
  ApiResponse,
  IncomeExpenseChartData,
  TransactionsResponse,
  TransactionWithContext
} from '../types';

export const transactionCreate = (body: any) => apiFetch('/transactions', 'POST', body, undefined);

export const transactionBulkCreate = (body: {
  transactions: any[];
}): Promise<ApiResponse<{ created: number; skipped: number }>> =>
  apiFetch('/transactions/bulk-create', 'POST', body);

export const transactionGetAll = (params: any): Promise<TransactionsResponse> =>
  apiFetch(`/transactions`, 'GET', undefined, { params });

export const transactionGetById = (id: string): Promise<ApiResponse<TransactionWithContext>> =>
  apiFetch(`/transactions/${id}`, 'GET', undefined, undefined);

export const transactionUpdate = (id: string, body: any) =>
  apiFetch(`/transactions/${id}`, 'PUT', body, undefined);

export const transactionDelete = (id: string) =>
  apiFetch(`/transactions/${id}`, 'DELETE', undefined, undefined);

export const transactionGetIncomeExpenseChart = (params: {
  accountId?: string;
  duration: string;
}): Promise<ApiResponse<IncomeExpenseChartData>> =>
  apiFetch('/transactions/by/income/expense/chart', 'GET', undefined, { params });

export const transactionGetCategoryChart = (params: {
  duration: string;
  accountId?: string;
}): Promise<ApiResponse<{ name: string[]; totalIncome: number[]; totalExpense: number[] }>> =>
  apiFetch('/transactions/by/category/chart', 'GET', undefined, { params });
