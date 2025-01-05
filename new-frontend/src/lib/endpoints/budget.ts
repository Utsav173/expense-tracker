import apiFetch from '../api-client';

export const budgetCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/budget', 'POST', body, undefined, successMessage, errorMessage);

export const budgetGetAll = (
  id: string,
  params: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch(`/budget/${id}/all`, 'GET', undefined, { params }, successMessage, errorMessage);

export const budgetUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch(`/budget/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const budgetDelete = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/budget/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const budgetGetSummary = (params: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/budget/summary', 'GET', undefined, { params }, successMessage, errorMessage);

export const budgetGetProgress = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/budget/${id}/progress`, 'GET', undefined, undefined, successMessage, errorMessage);
