import apiFetch from '../api-client';

export const goalCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/goal', 'POST', body, undefined, successMessage, errorMessage);

export const goalGetAll = (params: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/goal/all', 'GET', undefined, { params }, successMessage, errorMessage);

export const goalUpdate = (id: string, body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/goal/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const goalDelete = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/goal/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const goalAddAmount = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch(`/goal/${id}/add-amount`, 'PUT', body, undefined, successMessage, errorMessage);

export const goalWithdrawAmount = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch(`/goal/${id}/withdraw-amount`, 'PUT', body, undefined, successMessage, errorMessage);
