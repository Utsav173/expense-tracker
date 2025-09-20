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
  'financial-health-analysis': {
    analysis: {
      score: number;
      highlights: Array<{ emoji: string; statement: string }>;
      improvements: Array<{ emoji: string; statement: string }>;
      recommendations: Array<{ title: string; description: string }>;
    };
  };
};

// Define metadata for the session and user
type MyMeta = {
  sessionId: string;
  userId: string;
};

// Export the final, correctly typed UIMessage
export type MyUIMessage = UIMessage<MyMeta, MyCustomData, MyToolTypes>;
