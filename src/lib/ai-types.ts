import { UIMessage } from 'ai';
import type { AIAPI } from '@/lib/api/api-types';

// Define the specific shapes of your custom data parts that the backend streams.
export type MyCustomDataParts = {
  chart: {
    type: 'auto' | 'bar' | 'line' | 'pie';
    data: any[];
  };
  records: any[];
  metrics: Record<string, any>;
  imageAnalysisData: AIAPI.ExtractedTransaction[];
};

export type MyUIMessage = UIMessage<never, MyCustomDataParts>;
