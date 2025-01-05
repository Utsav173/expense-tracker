import apiFetch from '../api-client';

export const categoryCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/category', 'POST', body, undefined, successMessage, errorMessage);

export const categoryUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch(`/category/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const categoryGetAll = (params: any, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/category`, 'GET', undefined, { params }, successMessage, errorMessage);

export const categoryDelete = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/category/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);
