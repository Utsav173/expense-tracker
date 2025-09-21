import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { providersIds, UserAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type UpdateSettingsBody = z.infer<typeof apiEndpoints.settings.update.body>;

// This type now correctly reflects the payload from the frontend form
type UpdateAiProviderSettingsBody = {
  providerId: providersIds;
  apiKey: string | null | undefined; // Allows undefined
  modelId: string | null;
  providerOptions?: Record<string, any>;
};

export const getSettings = (): Promise<UserAPI.GetSettingsResponse> =>
  apiClient(apiEndpoints.settings.get);

export const updateSettings = (body: UpdateSettingsBody): Promise<UserAPI.UpdateSettingsResponse> =>
  apiClient(apiEndpoints.settings.update, { body });

export const updateAiProviderSettings = (
  body: UpdateAiProviderSettingsBody
): Promise<UserAPI.UpdateApiKeyResponse> =>
  apiClient(apiEndpoints.settings.updateAiSettings, { body });
