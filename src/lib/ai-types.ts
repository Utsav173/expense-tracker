import { UIMessage } from '@ai-sdk/react';
import type { MyToolTypes } from '@/lib/ai-tool-types';
import type { AIAPI } from '@/lib/api/api-types';

export type MyCustomData = {
  chart: {
    type: 'auto' | 'bar' | 'line' | 'pie';
    data: any[];
    followUpSuggestions?: string[];
  };
  records: {
    records: any[];
    count: number;
    followUpSuggestions?: string[];
  };
  metrics: {
    metrics: Record<string, any>;
    followUpSuggestions?: string[];
  };
  imageAnalysisData: AIAPI.ExtractedTransaction[];
  financialHealthAnalysis: AIAPI.FinancialHealthAnalysis & { followUpSuggestions?: string[] };
  subscriptionAnalysis: {
    subscriptions: Array<{
      merchant: string;
      frequency: string;
      averageAmount: number;
      transactionCount: number;
      lastPaymentDate: string;
    }>;
    followUpSuggestions?: string[];
  };
  clarificationOptions: Array<{
    id: string;
    name?: string;
    description?: string;
    currency?: string;
    details?: string;
    balance?: number;
  }>;
  stockSearchResults: Array<{
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  }>;
  ipoLink: string;
  createdEntitySummary: {
    type: string;
    name: string;
    id: string;
    details?: string;
  };
};

type MyMeta = {
  sessionId: string;
  userId: string;
};

export type MyUIMessage = UIMessage<MyMeta, MyCustomData, MyToolTypes>;
