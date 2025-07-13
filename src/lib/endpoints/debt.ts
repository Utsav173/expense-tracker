import apiFetch from '../api-client';
import { Debts, ApiResponse, DebtWithDetails, Payment } from '../types';

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

export const debtsMarkAsPaid = (id: string): Promise<ApiResponse<{ message: string }>> =>
  apiFetch(`/interest/debts/${id}/mark-paid`, 'PUT');

export const apiCreateDebt = (body: any): Promise<ApiResponse<{ message: string; data: Debts }>> =>
  apiFetch('/interest/debts', 'POST', body);

export const apiUpdateDebt = (id: string, body: any): Promise<ApiResponse<{ message: string }>> => {
  const payload = {
    description: body.description,
    duration: body.duration,
    frequency: body.frequency,
    isPaid: body.isPaid
  };

  return apiFetch(`/interest/debts/${id}`, 'PUT', payload);
};

export const apiDeleteDebt = (id: string): Promise<ApiResponse<{ message: string }>> =>
  apiFetch(`/interest/debts/${id}`, 'DELETE');

export const getOutstandingDebts = (): Promise<OutstandingDebtsResponse> =>
  apiFetch('/interest/debts', 'GET', undefined, {
    params: { type: 'taken', isPaid: 'false', pageSize: 100 }
  });

export const interestCalculate = (
  data: any
): Promise<ApiResponse<{ interest: number; totalAmount: number }>> =>
  apiFetch('/interest/calculate', 'POST', data);

export const getDebtSchedule = (id: string): Promise<ApiResponse<Payment[]>> =>
  apiFetch(`/interest/debts/${id}/schedule`, 'GET');
