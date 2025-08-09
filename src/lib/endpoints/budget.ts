import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { BudgetAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type CreateBudgetBody = z.infer<typeof apiEndpoints.budget.create.body>;
type UpdateBudgetBody = z.infer<typeof apiEndpoints.budget.update.body>;
type GetAllParams = z.infer<typeof apiEndpoints.budget.getAll.query>;
type GetSummaryParams = z.infer<typeof apiEndpoints.budget.getSummary.query>;

export const budgetCreate = (body: CreateBudgetBody) =>
  apiClient<unknown, unknown, CreateBudgetBody, BudgetAPI.CreateBudgetResponse>(
    apiEndpoints.budget.create,
    { body }
  );

export const budgetGetAll = (params: GetAllParams): Promise<BudgetAPI.GetBudgetsResponse> =>
  apiClient(apiEndpoints.budget.getAll, { query: params });

export const budgetUpdate = (id: string, body: UpdateBudgetBody) =>
  apiClient<{ id: string }, unknown, UpdateBudgetBody, BudgetAPI.UpdateBudgetResponse>(
    apiEndpoints.budget.update,
    { params: { id }, body }
  );

export const budgetDelete = (id: string) =>
  apiClient<{ id: string }, unknown, unknown, BudgetAPI.DeleteBudgetResponse>(
    apiEndpoints.budget.delete,
    { params: { id } }
  );

export const budgetGetSummary = (
  month: number,
  year: number
): Promise<BudgetAPI.GetBudgetSummaryResponse> => {
  const params: GetSummaryParams = { month: String(month), year: String(year) };
  return apiClient(apiEndpoints.budget.getSummary, { query: params });
};

export const budgetGetProgress = (id: string): Promise<BudgetAPI.GetBudgetProgressResponse> =>
  apiClient(apiEndpoints.budget.getProgress, { params: { id } });
