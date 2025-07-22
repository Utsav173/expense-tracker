import apiFetch from '../api-client';
import { ApiResponse, UserSettings } from '../types';

export const getSettings = (): Promise<ApiResponse<UserSettings>> => apiFetch('/settings', 'GET');

export const updateSettings = (
  body: Partial<UserSettings>
): Promise<ApiResponse<{ message: string; data: UserSettings }>> =>
  apiFetch('/settings', 'PUT', body);

export const updateAiApiKey = (body: {
  apiKey: string | null;
}): Promise<ApiResponse<{ message: string }>> => apiFetch('/settings/ai-key', 'PUT', body);
