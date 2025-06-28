import apiFetch from '../api-client';
import { Budget, Pagination, ApiResponse, BudgetSummaryItem } from '../types';

export const budgetCreate = (body: any) => apiFetch('/budget', 'POST', body);

export const budgetGetAll = (
  id: string,
  params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ApiResponse<{ data: Budget[]; pagination: Pagination }>> =>
  apiFetch(`/budget/${id}/all`, 'GET', undefined, { params });

export const budgetUpdate = (id: string, body: any) => apiFetch(`/budget/${id}`, 'PUT', body);

export const budgetDelete = (id: string) => apiFetch(`/budget/${id}`, 'DELETE');

export const budgetGetSummary = (
  month: number,
  year: number
): Promise<ApiResponse<BudgetSummaryItem[]>> => {
  const params = { month, year };
  return apiFetch('/budget/summary', 'GET', undefined, { params });
};

export const budgetGetProgress = (
  id: string
): Promise<
  ApiResponse<{
    budgetId: string;
    budgetedAmount: number;
    totalSpent: number;
    remainingAmount: number;
    progress: number;
  }>
> => apiFetch(`/budget/${id}/progress`, 'GET');
