import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { UserAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type UpdateSettingsBody = z.infer<typeof apiEndpoints.settings.update.body>;
type UpdateAiKeyBody = z.infer<typeof apiEndpoints.settings.updateAiKey.body>;

export const getSettings = (): Promise<UserAPI.GetSettingsResponse> =>
  apiClient(apiEndpoints.settings.get);

export const updateSettings = (body: UpdateSettingsBody): Promise<UserAPI.UpdateSettingsResponse> =>
  apiClient(apiEndpoints.settings.update, { body });

export const updateAiApiKey = (body: UpdateAiKeyBody): Promise<UserAPI.UpdateApiKeyResponse> =>
  apiClient(apiEndpoints.settings.updateAiKey, { body });
