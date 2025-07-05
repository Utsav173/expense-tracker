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

export const accountCreate = (body: any) => apiFetch('/accounts', 'POST', body);

export const accountGetAll = (
  params: any
): Promise<
  ApiResponse<{
    accounts: Account[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>
> => apiFetch('/accounts', 'GET', undefined, { params });

export const accountUpdate = (id: string, body: any) => apiFetch(`/accounts/${id}`, 'PUT', body);

export const accountDelete = (id: string) => apiFetch(`/accounts/${id}`, 'DELETE');

export const accountGetDropdown = (): Promise<ApiResponse<AccountDropdown[]>> =>
  apiFetch('/accounts/list', 'GET');

export const accountGetById = (id: string): Promise<ApiResponse<AccountDetails>> =>
  apiFetch(`/accounts/${id}`, 'GET');

type getStatementParams = {
  startDate?: string;
  endDate?: string;
  numTransactions?: string;
  exportType?: string;
};

export const accountGetStatement = (id: string, params: getStatementParams) =>
  apiFetch(`/accounts/${id}/statement`, 'GET', undefined, { params, responseType: 'blob' });

export const accountGetDashboard = (
  params: { duration?: string; startDate?: string; endDate?: string } = {}
): Promise<ApiResponse<DashboardData>> =>
  apiFetch('/accounts/dashboard', 'GET', undefined, { params });

export const accountGetCustomAnalytics = (
  id: string,
  params: any
): Promise<ApiResponse<CustomAnalytics>> =>
  apiFetch(`/accounts/customAnalytics/${id}`, 'GET', undefined, { params });

export const accountShare = (body: any) => apiFetch('/accounts/share', 'POST', body);

export const accountGetPreviousShares = (
  id: string
): Promise<ApiResponse<PreviousShareAccount[]>> =>
  apiFetch(`/accounts/previous/share/${id}`, 'GET');

export const accountGetSharedWithMe = (
  params: any
): Promise<ApiResponse<{ data: Account[]; pagination: any }>> =>
  apiFetch('/accounts/get-shares', 'GET', undefined, { params });

export const accountRevokeShare = (body: { accountId: string; userId: string }) =>
  apiFetch('/accounts/revoke-share', 'POST', body);
