// src/app/lib/endpoints/auth.ts

import apiFetch from '../api-client';

export const authSignup = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch(
    '/auth/signup',
    'POST',
    body,
    { headers: { 'Content-Type': 'multipart/form-data' } },
    successMessage,
    errorMessage,
  );

export const authLogin = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/login', 'POST', body, undefined, successMessage, errorMessage);

export const authForgotPassword = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/forgot-password', 'POST', body, undefined, successMessage, errorMessage);

export const authResetPassword = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/reset-password', 'POST', body, undefined, successMessage, errorMessage);

export const authGetMe = (successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/me', 'GET', undefined, undefined, successMessage, errorMessage);

export const authUpdateUser = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/update', 'PUT', body, undefined, successMessage, errorMessage);

export const authUpdateUserPreferences = (
  body: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch('/auth/preferences', 'PUT', body, undefined, successMessage, errorMessage);

export const authGetUserPreferences = (successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/preferences', 'GET', undefined, undefined, successMessage, errorMessage);

export const authLogOut = (successMessage?: string, errorMessage?: string) =>
  apiFetch('/auth/logout', 'POST', undefined, undefined, successMessage, errorMessage);
