import apiFetch from '../api-client';
import { Debts, ApiResponse } from '../types';

type DebtResponse = ApiResponse<{
  data: Debts[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}>;
export const debtsMarkAsPaid = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(
    `/interest/debts/${id}/mark-paid`,
    'PUT',
    undefined,
    undefined,
    successMessage,
    errorMessage,
  );

export const apiFetchDebts = async (params: any): Promise<DebtResponse> => {
  return apiFetch('/interest/debts', 'GET', undefined, { params });
};
