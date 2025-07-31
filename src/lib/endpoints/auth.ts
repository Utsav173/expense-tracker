import apiFetch from '../api-client';
import { LoginResponse, User, ApiResponse } from '@/lib/types';
import { authClient } from '@/lib/auth-client';

type UserApiResponse = ApiResponse<User & { hasAiApiKey?: boolean }>;
type LoginApiResponse = ApiResponse<LoginResponse>;

export const authSignup = (body: any) =>
  apiFetch('/auth/signup', 'POST', body, { headers: { 'Content-Type': 'multipart/form-data' } });

export const authLogin = (body: any): Promise<LoginApiResponse> =>
  apiFetch('/auth/login', 'POST', body);

export const authForgotPassword = (body: any) => authClient.forgetPassword(body);

export const authResetPassword = (body: any) => authClient.resetPassword(body);

export const authGetMe = (): Promise<UserApiResponse> => apiFetch('/auth/me', 'GET');

export const authUpdateUser = (body: any) =>
  apiFetch('/auth/update', 'PUT', body, { headers: { 'Content-Type': 'multipart/form-data' } });

export const authUpdateUserPreferences = (body: any) => apiFetch('/auth/preferences', 'PUT', body);

export const authGetUserPreferences = (): Promise<
  ApiResponse<{
    preferredCurrency: string | null;
  }>
> => apiFetch('/auth/preferences', 'GET');

export const authLogOut = (): Promise<ApiResponse<null>> => apiFetch('/auth/logout', 'POST');
