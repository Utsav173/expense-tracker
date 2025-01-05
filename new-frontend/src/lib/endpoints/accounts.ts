import apiFetch from '../api-client';
import { Account } from '../types';

export const accountCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/accounts', 'POST', body, undefined, successMessage, errorMessage);

export const accountGetAll = (
  params: any,
  successMessage?: string,
  errorMessage?: string,
): Promise<{ accounts: Account[] }> =>
  apiFetch('/accounts', 'GET', undefined, { params }, successMessage, errorMessage);

export const accountUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch(`/accounts/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const accountGetDropdown = (successMessage?: string, errorMessage?: string) =>
  apiFetch('/accounts/list', 'GET', undefined, undefined, successMessage, errorMessage);

export const accountGetById = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/accounts/${id}`, 'GET', undefined, undefined, successMessage, errorMessage);

export const accountGetStatement = (
  id: string,
  params: any,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch(`/accounts/${id}/statement`, 'GET', undefined, { params }, successMessage, errorMessage);
