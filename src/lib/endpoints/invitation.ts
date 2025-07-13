import apiFetch from '../api-client';
import { ApiResponse } from '@/lib/types';

export const verifyInvitation = (token: string): Promise<ApiResponse<any>> => {
  return apiFetch(`/invite/verify?token=${token}`, 'GET');
};

export const sendInvitation = (email: string): Promise<ApiResponse<any>> => {
  return apiFetch('/invite', 'POST', { email });
};
