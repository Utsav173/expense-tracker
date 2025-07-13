import apiFetch from '../api-client';
import { ApiResponse, DropdownUser } from '../types';

export const userSearch = (query?: string): Promise<ApiResponse<DropdownUser[]>> =>
  apiFetch(`accounts/dropdown/user?query=${query}`, 'GET');
