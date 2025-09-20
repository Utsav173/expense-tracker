import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { AIAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type PdfProcessBody = z.infer<typeof apiEndpoints.ai.processPdf.body>;

export const aiProcessTransactionPdf = (body: PdfProcessBody): Promise<AIAPI.ProcessPdfResponse> =>
  apiClient(apiEndpoints.ai.processPdf, { body });
