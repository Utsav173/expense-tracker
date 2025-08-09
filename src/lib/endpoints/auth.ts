import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { UserAPI } from '@/lib/api/api-types';
import { authClient } from '@/lib/auth-client';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.').max(64).trim(),
  preferredCurrency: z.string().optional().or(z.literal('')),
  image: z.instanceof(File).optional().nullable()
});

export type UpdateUserBody = z.infer<typeof profileUpdateSchema>;
type UpdatePreferencesBody = z.infer<typeof apiEndpoints.user.updatePreferences.body>;

export const authForgotPassword = (body: { email: string }) => authClient.forgetPassword(body);

export const authResetPassword = (body: { email: string; otp: string; password: string }) =>
  authClient.resetPassword({
    ...body,
    newPassword: body.password
  });

export const authGetMe = (): Promise<UserAPI.GetMeResponse> => apiClient(apiEndpoints.user.getMe);

export const authUpdateUser = (body: UpdateUserBody) => {
  const formData = new FormData();
  if (body.name) formData.append('name', body.name);
  if (body.preferredCurrency) formData.append('preferredCurrency', body.preferredCurrency);
  if (body.image instanceof File) formData.append('image', body.image);

  return apiClient<unknown, unknown, FormData, UserAPI.UpdateUserResponse>(
    apiEndpoints.user.update,
    {
      body: formData,
      axiosConfig: { headers: { 'Content-Type': 'multipart/form-data' } }
    }
  );
};

export const authUpdateUserPreferences = (body: UpdatePreferencesBody) =>
  apiClient<unknown, unknown, UpdatePreferencesBody, UserAPI.UpdatePreferencesResponse>(
    apiEndpoints.user.updatePreferences,
    { body }
  );

export const authGetUserPreferences = (): Promise<UserAPI.GetPreferencesResponse> =>
  apiClient(apiEndpoints.user.getPreferences);
