import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { AccountAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type CreateAccountBody = z.infer<typeof apiEndpoints.accounts.create.body>;
type UpdateAccountBody = z.infer<typeof apiEndpoints.accounts.update.body>;
type ShareAccountBody = z.infer<typeof apiEndpoints.accounts.shareAccount.body>;
type RevokeShareBody = z.infer<typeof apiEndpoints.accounts.revokeShare.body>;
type GetStatementParams = z.infer<typeof apiEndpoints.accounts.getStatement.query>;
type GetAllParams = z.infer<typeof apiEndpoints.accounts.getAll.query>;
type AccountsDropdownParams = z.infer<typeof apiEndpoints.accounts.getAccountsDropdown.query>;
type GetSharedParams = z.infer<typeof apiEndpoints.accounts.getSharedAccounts.query>;

export const accountCreate = (body: CreateAccountBody) =>
  apiClient<unknown, unknown, CreateAccountBody, AccountAPI.CreateAccountResponse>(
    apiEndpoints.accounts.create,
    { body }
  );

export const accountGetAll = (params: GetAllParams): Promise<AccountAPI.GetAccountsResponse> =>
  apiClient(apiEndpoints.accounts.getAll, { query: params });

export const getAccountsDropdown = (
  params: AccountsDropdownParams
): Promise<AccountAPI.AccountDropdown[]> =>
  apiClient(apiEndpoints.accounts.getAccountsDropdown, { query: params });

export const accountUpdate = (id: string, body: UpdateAccountBody) =>
  apiClient<{ id: string }, unknown, UpdateAccountBody, AccountAPI.UpdateAccountResponse>(
    apiEndpoints.accounts.update,
    { params: { id }, body }
  );

export const accountDelete = (id: string) =>
  apiClient<{ id: string }, unknown, unknown, AccountAPI.DeleteAccountResponse>(
    apiEndpoints.accounts.delete,
    { params: { id } }
  );

export const accountGetDropdown = (): Promise<AccountAPI.GetAccountListSimpleResponse> =>
  apiClient(apiEndpoints.accounts.getList);

export const accountGetById = (id: string): Promise<AccountAPI.GetAccountByIdResponse> =>
  apiClient<{ id: string }, unknown, unknown, AccountAPI.GetAccountByIdResponse>(
    apiEndpoints.accounts.getById,
    { params: { id } }
  );

export const accountGetStatement = (id: string, params: GetStatementParams) =>
  apiClient<{ id: string }, GetStatementParams, unknown, Blob>(apiEndpoints.accounts.getStatement, {
    params: { id },
    query: { ...params, exportType: params.exportType || 'pdf' },
    axiosConfig: { responseType: 'blob' }
  });

export const accountGetDashboard = (
  params: { duration?: string; startDate?: string; endDate?: string } = {}
): Promise<AccountAPI.GetDashboardResponse> =>
  apiClient(apiEndpoints.accounts.getDashboard, { query: params });

export const accountGetCustomAnalytics = (
  id: string,
  params: { duration: string }
): Promise<AccountAPI.GetCustomAnalyticsResponse> =>
  apiClient(apiEndpoints.accounts.getCustomAnalytics, { params: { id }, query: params });

export const accountShare = (body: ShareAccountBody) =>
  apiClient<unknown, unknown, ShareAccountBody, AccountAPI.ShareAccountResponse>(
    apiEndpoints.accounts.shareAccount,
    { body }
  );

export const accountGetPreviousShares = (
  id: string
): Promise<AccountAPI.GetPreviousSharesResponse> =>
  apiClient(apiEndpoints.accounts.getPreviousShares, { params: { id } });

export const accountGetSharedWithMe = (
  params: GetSharedParams
): Promise<AccountAPI.GetSharedAccountsResponse> =>
  apiClient(apiEndpoints.accounts.getSharedAccounts, { query: params });

export const accountRevokeShare = (body: RevokeShareBody) =>
  apiClient<unknown, unknown, RevokeShareBody, AccountAPI.RevokeShareResponse>(
    apiEndpoints.accounts.revokeShare,
    { body }
  );
