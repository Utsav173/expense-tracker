import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { AIAPI } from '@/lib/api/api-types';

export const getFinancialHealthAnalysis = async (): Promise<AIAPI.GetFinancialHealthResponse> =>
  await apiClient(apiEndpoints.ai.getFinancialHealth);
