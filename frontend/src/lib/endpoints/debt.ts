// /home/utsav/coding/expense-tracker/frontend/src/lib/endpoints/debt.ts
import apiFetch from '../api-client';
import { Debts, ApiResponse, DebtWithDetails } from '../types';

type DebtsPaginatedResponse = ApiResponse<{
  data: DebtWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}>;

type OutstandingDebtsResponse = ApiResponse<{
  data: DebtWithDetails[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
}>;

export const apiFetchDebts = async (
  params: {
    page?: number;
    pageSize?: number;
    q?: string;
    type?: 'given' | 'taken' | '';
    duration?: string;
    sortOrder?: 'asc' | 'desc';
    sortBy?: string;
    isPaid?: 'true' | 'false';
  } = {}
): Promise<DebtsPaginatedResponse> => {
  return apiFetch('/interest/debts', 'GET', undefined, { params });
};

export const debtsMarkAsPaid = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string }>> =>
  apiFetch(
    `/interest/debts/${id}/mark-paid`,
    'PUT',
    undefined,
    undefined,
    successMessage || 'Debt marked as paid',
    errorMessage
  );

export const apiCreateDebt = (
  body: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string; data: Debts }>> =>
  apiFetch(
    '/interest/debts',
    'POST',
    body,
    undefined,
    successMessage || 'Debt created successfully',
    errorMessage
  );

export const apiUpdateDebt = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string }>> => {
  const payload = {
    description: body.description,
    duration: body.duration,
    frequency: body.frequency,
    isPaid: body.isPaid
  };

  return apiFetch(
    `/interest/debts/${id}`,
    'PUT',
    payload,
    undefined,
    successMessage || 'Debt updated successfully',
    errorMessage
  );
};

export const apiDeleteDebt = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string }>> =>
  apiFetch(
    `/interest/debts/${id}`,
    'DELETE',
    undefined,
    undefined,
    successMessage || 'Debt deleted successfully',
    errorMessage
  );

export const getOutstandingDebts = (
  successMessage?: string,
  errorMessage?: string
): Promise<OutstandingDebtsResponse> =>
  apiFetch(
    '/interest/debts',
    'GET',
    undefined,
    { params: { type: 'taken', isPaid: 'false', pageSize: 500 } },
    successMessage,
    errorMessage || 'Failed to fetch outstanding debts'
  );

export const interestCreate = (
  data: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ interest: number; totalAmount: number }>> =>
  apiFetch(
    '/interest/create',
    'POST',
    data,
    undefined,
    successMessage,
    errorMessage || 'Failed to calculate interest'
  );
