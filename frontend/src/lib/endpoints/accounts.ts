import apiFetch from '../api-client';
import {
  Account,
  AccountDetails,
  AccountDropdown,
  ApiResponse,
  CustomAnalytics,
  DashboardData,
  DropdownUser,
  PreviousShareAccount
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

export const accountGetDashboard = (
  params: { duration?: string; startDate?: string; endDate?: string } = {},
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<DashboardData>> =>
  apiFetch(
    '/accounts/dashboard',
    'GET',
    undefined,
    { params },
    successMessage,
    errorMessage || 'Failed to get dashboard data'
  );

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

export const accountGetPreviousShares = (
  id: string,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<PreviousShareAccount[]>> =>
  apiFetch(
    `/accounts/previous/share/${id}`,
    'GET',
    undefined,
    undefined,
    successMessage,
    errorMessage
  );

export const usersGetDropdown = (): Promise<ApiResponse<DropdownUser[]>> =>
  apiFetch('/accounts/dropdown/user', 'GET', undefined, undefined, '', 'Failed to get users list');

export const accountGetSharedWithMe = (
  params: any,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ data: Account[]; pagination: any }>> =>
  apiFetch('/accounts/get-shares', 'GET', undefined, { params }, successMessage, errorMessage);
