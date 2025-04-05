import apiFetch from '../api-client';
import { Budget, Pagination, ApiResponse, BudgetSummaryItem } from '../types';

export const budgetCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/budget', 'POST', body, undefined, successMessage, errorMessage);

export const budgetGetAll = (
  id: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ data: Budget[]; pagination: Pagination }>> =>
  apiFetch(`/budget/${id}/all`, 'GET', undefined, { params }, successMessage, errorMessage);

export const budgetUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
) => apiFetch(`/budget/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const budgetDelete = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/budget/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const budgetGetSummary = (
  month: number,
  year: number,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<BudgetSummaryItem[]>> => {
  const params = { month, year };
  return apiFetch(
    '/budget/summary',
    'GET',
    undefined,
    { params },
    successMessage,
    errorMessage || 'Failed to get budget summary'
  );
};

export const budgetGetProgress = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<
  ApiResponse<{
    budgetId: string;
    budgetedAmount: number;
    totalSpent: number;
    remainingAmount: number;
    progress: number;
  }>
> => apiFetch(`/budget/${id}/progress`, 'GET', undefined, undefined, successMessage, errorMessage);
