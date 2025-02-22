import apiFetch from '../api-client';
import {
  Account,
  AccountDetails,
  AccountDropdown,
  ApiResponse,
  CustomAnalytics,
  DashboardData
} from '../types';

export const accountCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/accounts', 'POST', body, undefined, successMessage, errorMessage);

export const accountGetAll = (
  params: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ accounts: Account[]; total: number }>> =>
  apiFetch('/accounts', 'GET', undefined, { params }, successMessage, errorMessage);

export const accountUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
) => apiFetch(`/accounts/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const accountDelete = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/accounts/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const accountGetDropdown = (): Promise<ApiResponse<AccountDropdown[]>> =>
  apiFetch('/accounts/list', 'GET', undefined, undefined, '', 'Failed to get accounts list');

export const accountGetById = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<AccountDetails>> =>
  apiFetch(`/accounts/${id}`, 'GET', undefined, undefined, successMessage, errorMessage);

export const accountGetStatement = (
  id: string,
  params: any,
  successMessage?: string,
  errorMessage?: string
) =>
  apiFetch(`/accounts/${id}/statement`, 'GET', undefined, { params }, successMessage, errorMessage);

export const accountGetDashboard = (): Promise<ApiResponse<DashboardData>> => // Use the new type!
  apiFetch('/accounts/dashboard', 'GET', undefined, undefined, '', 'Failed to get dashboard');

export const accountGetCustomAnalytics = (
  id: string,
  params: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<CustomAnalytics>> =>
  apiFetch(
    `/accounts/customAnalytics/${id}`,
    'GET',
    undefined,
    { params },
    successMessage,
    errorMessage
  );

export const accountShare = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/accounts/share', 'POST', body, undefined, successMessage, errorMessage);
