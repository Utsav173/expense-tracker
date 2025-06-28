import apiFetch from '../api-client';
import {
  AiProcessPdfRequest,
  AiProcessPdfResponse,
  AiProcessRequest,
  AiProcessResponse,
  ApiResponse
} from '../types';

export const aiProcessPrompt = (body: AiProcessRequest): Promise<ApiResponse<AiProcessResponse>> =>
  apiFetch('/ai/process', 'POST', body);

export const aiProcessTransactionPdf = (
  body: AiProcessPdfRequest
): Promise<ApiResponse<AiProcessPdfResponse>> => apiFetch('/ai/process-pdf', 'POST', body);
