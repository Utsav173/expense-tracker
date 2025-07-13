import { Pagination, SavingGoal, ApiResponse } from '../types';
import apiFetch from '../api-client';

export type GoalApiPayload = {
  name: string;
  targetAmount: number;
  savedAmount?: number;
  targetDate?: string | null;
};

export const goalCreate = (body: {
  name: string;
  targetAmount: number;
  targetDate?: string;
}): Promise<ApiResponse<SavingGoal>> => apiFetch('/goal', 'POST', body);

export const goalGetAll = (params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ApiResponse<{ data: SavingGoal[]; pagination: Pagination }>> =>
  apiFetch('/goal/all', 'GET', undefined, { params });

export const goalUpdate = (
  id: string,
  body: GoalApiPayload
): Promise<ApiResponse<{ message: string; id: string }>> => apiFetch(`/goal/${id}`, 'PUT', body);

export const goalDelete = (id: string): Promise<ApiResponse<{ message: string }>> =>
  apiFetch(`/goal/${id}`, 'DELETE', undefined);

export const goalAddAmount = (
  id: string,
  body: { amount: number }
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(`/goal/${id}/add-amount`, 'PUT', body);

export const goalWithdrawAmount = (
  id: string,
  body: { amount: number }
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(`/goal/${id}/withdraw-amount`, 'PUT', body);
