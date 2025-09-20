import { UIMessage } from '@ai-sdk/react';

// Define custom data parts
type TransactionPart = {
  type: 'transactions';
  transactions: Array<{
    date: string;
    description: string;
    debit?: number;
    credit?: number;
    category: string;
  }>;
};

type ChartPart = {
  type: 'chart';
  chart: any; // Define a more specific chart type if possible
};

type RecordsPart = {
  type: 'records';
  records: any[];
};

type MetricsPart = {
  type: 'metrics';
  metrics: Record<string, any>;
};

type ImageAnalysisPart = {
  type: 'image-analysis';
  imageAnalysisData: any[];
};

type FinancialHealthAnalysisPart = {
  type: 'financial-health-analysis';
  analysis: {
    score: number;
    highlights: Array<{ emoji: string; statement: string }>;
    improvements: Array<{ emoji: string; statement: string }>;
    recommendations: Array<{ title: string; description: string }>;
  };
};

// Define metadata for the session and user
type MyMeta = {
  sessionId: string;
  userId: string;
};

// Combine all custom parts into a single union type
type CustomData =
  | TransactionPart
  | ChartPart
  | RecordsPart
  | MetricsPart
  | ImageAnalysisPart
  | FinancialHealthAnalysisPart;

// Export the final UIMessage type
export type MyUIMessage = UIMessage<MyMeta, CustomData, { toolResult?: any }>;
