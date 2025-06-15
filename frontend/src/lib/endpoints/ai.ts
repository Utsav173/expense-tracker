import apiFetch from '../api-client';
import { ApiResponse } from '../types';

interface AiProcessRequest {
  prompt: string;
  sessionId?: string;
}

interface AiProcessResponse {
  response: string;
  sessionId: string;
  toolCalls?: any[];
  toolResults?: any[];
}

/**
 * Sends a prompt to the AI processing endpoint.
 * @param body - The request payload containing the prompt and optional sessionId.
 * @param successMessage - Optional success message for toast notifications.
 * @param errorMessage - Optional error message for toast notifications.
 * @returns A promise resolving to the AI's response and session ID.
 */
export const aiProcessPrompt = (
  body: AiProcessRequest,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<AiProcessResponse>> =>
  apiFetch(
    '/ai/process',
    'POST',
    body,
    undefined,
    successMessage,
    errorMessage || 'Failed to process AI request.'
  );
