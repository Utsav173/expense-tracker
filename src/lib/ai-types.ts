import type { UIMessage, UIMessagePart } from 'ai';
import type { MyToolTypes } from './ai-tool-types';

export type MyCustomData = Record<string, unknown>;

export type MyUIMessage = UIMessage<MyCustomData, MyToolTypes>;

export type MyUIMessagePart = UIMessagePart<MyCustomData, MyToolTypes>;

// Extract tool output types
export type ToolOutputTypes = {
  [K in keyof MyToolTypes]: MyToolTypes[K]['output'];
};

// Helper to get tool output type
export type ToolOutput<T extends keyof MyToolTypes> = MyToolTypes[T]['output'];

// Generic data part types
export interface DataPartBase {
  id: string;
  type: string;
  content: unknown;
}

export interface TextDataPart extends DataPartBase {
  type: 'text';
  content: string;
}

export interface JsonDataPart extends DataPartBase {
  type: 'json';
  content: Record<string, unknown>;
}

export interface ChartDataPart extends DataPartBase {
  type: 'data-chart';
  content: {
    type: 'auto' | 'bar' | 'line' | 'pie';
    data: Array<Record<string, unknown>>;
  };
}

export interface RecordsDataPart extends DataPartBase {
  type: 'data-records';
  content: {
    records: Array<Record<string, unknown>>;
    count: number;
  };
}

export interface MetricsDataPart extends DataPartBase {
  type: 'data-metrics';
  content: Record<string, unknown>;
}

export interface ClarificationDataPart extends DataPartBase {
  type: 'data-clarificationOptions';
  content: {
    message: string;
    options: Array<{
      id: string;
      name?: string;
      description?: string;
      details?: string;
      [key: string]: unknown;
    }>;
  };
}

export interface ConfirmationDataPart extends DataPartBase {
  type: 'data-confirmation';
  content: {
    id: string;
    details: string;
    message: string;
  };
}

export interface CreatedEntityDataPart extends DataPartBase {
  type: 'data-createdEntitySummary';
  content: {
    type: string;
    name: string;
    id: string;
    details?: string;
  };
}

export interface FileDataPart extends DataPartBase {
  type: 'file';
  content: {
    mediaType: string;
    url: string;
    filename?: string;
  };
}

export type RenderableDataPart =
  | TextDataPart
  | FileDataPart
  | JsonDataPart
  | ChartDataPart
  | RecordsDataPart
  | MetricsDataPart
  | ClarificationDataPart
  | ConfirmationDataPart
  | CreatedEntityDataPart
  | (DataPartBase & { type: string; content: unknown });
