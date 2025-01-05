import apiFetch from '../api-client';

export const debtsMarkAsPaid = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(
    `/interest/debts/${id}/mark-paid`,
    'PUT',
    undefined,
    undefined,
    successMessage,
    errorMessage,
  );
