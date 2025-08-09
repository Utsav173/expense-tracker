import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { AccountAPI } from '@/lib/api/api-types';

export const userSearch = (query?: string): Promise<AccountAPI.GetUsersForDropdownResponse> =>
  apiClient(apiEndpoints.accounts.getUsersForDropdown, { query: { q: query } });
