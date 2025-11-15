// src/types/ai.ts

import { UIMessage } from '@ai-sdk/react';
import type { MyToolTypes } from '@/lib/ai-tool-types';
import type { AIAPI } from '@/lib/api/api-types';

// This is the main fix. The keys of this object ('chart', 'records', etc.)
// will be used by the SDK to create the part types ('data-chart', 'data-records', etc.).
export type MyCustomData = {
  chart: {
    type: 'auto' | 'bar' | 'line' | 'pie';
    data: any[];
  };
  records: {
    records: any[];
    count: number;
  };
  metrics: {
    metrics: Record<string, any>;
  };
  imageAnalysisData: AIAPI.ExtractedTransaction[];
  financialHealthAnalysis: {
    score: number;
    highlights: Array<{ emoji: string; statement: string }>;
    improvements: Array<{ emoji: string; statement: string }>;
    recommendations: Array<{ title: string; description: string }>;
  };
  subscriptionAnalysis: {
    subscriptions: Array<{
      merchant: string;
      frequency: string;
      averageAmount: number;
      transactionCount: number;
      lastPaymentDate: string;
    }>;
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
    type: string; // e.g., 'Account', 'Budget', 'Goal'
    name: string;
    id: string;
    details?: string; // A summary string
  };
};

// Define metadata for the session and user
type MyMeta = {
  sessionId: string;
  userId: string;
};

// Export the final, correctly typed UIMessage
export type MyUIMessage = UIMessage<MyMeta, MyCustomData, MyToolTypes>;
