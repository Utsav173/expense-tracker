import apiFetch from '../api-client';
import { ApiResponse } from '../types';

// Define the structure for the request payload
interface AiProcessRequest {
  prompt: string;
  sessionId?: string;
}

// Define the structure for the expected API response
interface AiProcessResponse {
  response: string; // The AI's primary text response
  sessionId: string; // The session ID for continuation
  toolCalls?: any[]; // Optional tool calls made by the AI
  toolResults?: any[]; // Optional results of tool calls
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
    '/ai/process', // Ensure this matches your backend route
    'POST',
    body,
    undefined,
    successMessage,
    errorMessage || 'Failed to process AI request.' // Default error message
  );
