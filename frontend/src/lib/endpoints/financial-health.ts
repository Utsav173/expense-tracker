import apiFetch from '../api-client';

export interface FinancialHealthAnalysis {
  score: number;
  highlights: { emoji: string; statement: string }[];
  improvements: { emoji: string; statement: string }[];
  recommendations: { title: string; description: string }[];
}

export const getFinancialHealthAnalysis = async (): Promise<FinancialHealthAnalysis> =>
  await apiFetch('/ai/financial-health/analysis', 'GET');
