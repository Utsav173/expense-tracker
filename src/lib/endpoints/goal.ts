import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { GoalAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type CreateGoalBody = z.infer<typeof apiEndpoints.goal.create.body>;
type UpdateGoalBody = z.infer<typeof apiEndpoints.goal.update.body>;
type GetAllParams = z.infer<typeof apiEndpoints.goal.getAll.query>;
type AmountBody = z.infer<typeof apiEndpoints.goal.addAmount.body>;

export const goalCreate = (body: CreateGoalBody): Promise<GoalAPI.CreateGoalResponse> =>
  apiClient(apiEndpoints.goal.create, { body });

export const goalGetAll = (params: GetAllParams): Promise<GoalAPI.GetGoalsResponse> =>
  apiClient(apiEndpoints.goal.getAll, { query: params });

export const goalUpdate = (id: string, body: UpdateGoalBody): Promise<GoalAPI.UpdateGoalResponse> =>
  apiClient(apiEndpoints.goal.update, { params: { id }, body });

export const goalDelete = (id: string): Promise<GoalAPI.DeleteGoalResponse> =>
  apiClient(apiEndpoints.goal.delete, { params: { id } });

export const goalAddAmount = (id: string, body: AmountBody): Promise<GoalAPI.AddAmountResponse> =>
  apiClient(apiEndpoints.goal.addAmount, { params: { id }, body });

export const goalWithdrawAmount = (
  id: string,
  body: AmountBody
): Promise<GoalAPI.WithdrawAmountResponse> =>
  apiClient(apiEndpoints.goal.withdrawAmount, { params: { id }, body });
