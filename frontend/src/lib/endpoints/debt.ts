import apiFetch from '../api-client';
import { Debts, ApiResponse } from '../types';

type DebtResponse = ApiResponse<{
  data: Debts[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}>;

export const apiFetchDebts = async (params: any): Promise<DebtResponse> => {
  return apiFetch('/interest/debts', 'GET', undefined, { params });
};

export const debtsMarkAsPaid = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(
    `/interest/debts/${id}/mark-paid`,
    'PUT',
    undefined,
    undefined,
    successMessage,
    errorMessage
  );

// Add these new API functions:
export const apiCreateDebt = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/interest/debts', 'POST', body, undefined, successMessage, errorMessage);

export const apiUpdateDebt = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
) => apiFetch(`/interest/debts/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

// You'll also need a delete endpoint on the backend
export const apiDeleteDebt = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/interest/debts/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const interestCreate = async (data: any) => {
  const response = await fetch('/api/interest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to create interest');
  }

  return response.json();
};
