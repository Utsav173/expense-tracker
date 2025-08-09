import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { DebtAndInterestAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type FetchDebtsParams = z.infer<typeof apiEndpoints.interest.getDebts.query>;
type CreateDebtBody = z.infer<typeof apiEndpoints.interest.createDebt.body>;
type UpdateDebtBody = z.infer<typeof apiEndpoints.interest.updateDebt.body>;
type CalculateInterestBody = z.infer<typeof apiEndpoints.interest.calculate.body>;

export const apiFetchDebts = async (
  params?: FetchDebtsParams
): Promise<DebtAndInterestAPI.GetDebtsResponse> => {
  return apiClient(apiEndpoints.interest.getDebts, { query: params });
};

export const debtsMarkAsPaid = (id: string): Promise<DebtAndInterestAPI.MarkDebtAsPaidResponse> =>
  apiClient(apiEndpoints.interest.markDebtAsPaid, { params: { id } });

export const apiCreateDebt = (
  body: CreateDebtBody
): Promise<DebtAndInterestAPI.CreateDebtResponse> =>
  apiClient(apiEndpoints.interest.createDebt, { body });

export const apiUpdateDebt = (
  id: string,
  body: UpdateDebtBody
): Promise<DebtAndInterestAPI.UpdateDebtResponse> => {
  return apiClient(apiEndpoints.interest.updateDebt, { params: { id }, body });
};

export const apiDeleteDebt = (id: string): Promise<DebtAndInterestAPI.DeleteDebtResponse> =>
  apiClient(apiEndpoints.interest.deleteDebt, { params: { id } });

export const getOutstandingDebts = (): Promise<DebtAndInterestAPI.GetDebtsResponse> =>
  apiClient(apiEndpoints.interest.getDebts, {
    query: { type: 'taken', isPaid: 'false', limit: 100 }
  });

export const interestCalculate = (
  data: CalculateInterestBody
): Promise<DebtAndInterestAPI.CalculateInterestResponse> =>
  apiClient(apiEndpoints.interest.calculate, { body: data });

export const getDebtSchedule = (id: string): Promise<DebtAndInterestAPI.GetDebtScheduleResponse> =>
  apiClient(apiEndpoints.interest.getDebtSchedule, { params: { id } });
