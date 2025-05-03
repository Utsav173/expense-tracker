import apiFetch from '../api-client';
import { LoginResponse, User, ApiResponse } from '@/lib/types';
type UserApiResponse = ApiResponse<User & { hasAiApiKey?: boolean }>; // Update User type if needed
type LoginApiResponse = ApiResponse<LoginResponse>;

export const authSignup = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch(
    '/auth/signup',
    'POST',
    body,
    { headers: { 'Content-Type': 'multipart/form-data' } },
    successMessage,
    errorMessage
  );

export const authLogin = (
  body: any,
  successMessage?: string,
  errorMessage?: string
): Promise<LoginApiResponse> =>
  apiFetch('/auth/login', 'POST', body, undefined, successMessage, errorMessage);

export const authForgotPassword = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/forgot-password', 'POST', body, undefined, successMessage, errorMessage);

export const authResetPassword = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/reset-password', 'POST', body, undefined, successMessage, errorMessage);

export const authGetMe = (): Promise<UserApiResponse> =>
  apiFetch(
    '/auth/me',
    'GET',
    undefined,
    undefined,
    undefined,
    'Failed to get current user'
  ) as Promise<UserApiResponse>;

export const authUpdateUser = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch(
    '/auth/update',
    'PUT',
    body,
    { headers: { 'Content-Type': 'multipart/form-data' } },
    successMessage,
    errorMessage
  );

// --- NEW FUNCTION ---
/**
 * Updates or removes the user's AI API key.
 * @param apiKey The new API key string, or null to remove the key.
 * @param successMessage Optional success toast message.
 * @param errorMessage Optional error toast message.
 */
export const authUpdateUserAiApiKey = (
  apiKey: string | null,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ message: string }>> =>
  apiFetch('/auth/ai-key', 'PUT', { apiKey }, undefined, successMessage, errorMessage);

export const authUpdateUserPreferences = (
  body: any,
  successMessage?: string,
  errorMessage?: string
) => apiFetch('/auth/preferences', 'PUT', body, undefined, successMessage, errorMessage);

export const authGetUserPreferences = (): Promise<
  ApiResponse<{
    preferredCurrency: string | null;
  }>
> =>
  apiFetch(
    '/auth/preferences',
    'GET',
    undefined,
    undefined,
    undefined,
    'Failed to get user preferences'
  );

export const authLogOut = (
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<null>> =>
  apiFetch('/auth/logout', 'POST', undefined, undefined, successMessage, errorMessage);
