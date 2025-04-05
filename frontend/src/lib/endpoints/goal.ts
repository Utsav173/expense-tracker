import { Pagination, SavingGoal, ApiResponse } from '../types';
import apiFetch from '../api-client';

export const goalCreate = (
  body: { name: string; targetAmount: number; targetDate?: string },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<SavingGoal>> =>
  apiFetch('/goal', 'POST', body, undefined, successMessage, errorMessage);

export const goalGetAll = (
  params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ data: SavingGoal[]; pagination: Pagination }>> =>
  apiFetch('/goal/all', 'GET', undefined, { params }, successMessage, errorMessage);

export const goalUpdate = (
  id: string,
  body: { name?: string; targetAmount?: number; savedAmount?: number; targetDate?: Date },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(`/goal/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const goalDelete = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string }>> =>
  apiFetch(`/goal/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const goalAddAmount = (
  id: string,
  body: { amount: number },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(`/goal/${id}/add-amount`, 'PUT', body, undefined, successMessage, errorMessage);

export const goalWithdrawAmount = (
  id: string,
  body: { amount: number },
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string; id: string }>> =>
  apiFetch(`/goal/${id}/withdraw-amount`, 'PUT', body, undefined, successMessage, errorMessage);
