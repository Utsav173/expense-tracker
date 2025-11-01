import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { AIAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type PdfProcessBody = z.infer<typeof apiEndpoints.ai.processPdf.body>;

export const aiProcessTransactionPdf = (body: PdfProcessBody): Promise<AIAPI.ProcessPdfResponse> =>
  apiClient(apiEndpoints.ai.processPdf, { body });

export const aiGetSuggestions = (): Promise<string[]> => apiClient(apiEndpoints.ai.getSuggestions);

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

export interface AIProvider {
  id: 'google' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'qwen';
  name: string;
  docsUrl: string;
  models: AIModel[];
}

export const aiGetAvailableProviders = async (): Promise<AIProvider[]> =>
  apiClient(apiEndpoints.ai.getProviders);
