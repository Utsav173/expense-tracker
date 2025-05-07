import apiFetch from '../api-client';
import { ApiResponse } from '../types';

interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactFormResponse {
  message: string;
}

export const submitContactForm = (
  body: ContactFormPayload,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<ContactFormResponse>> =>
  apiFetch(
    '/contact', // This should match the backend route (e.g., /contact if mounted at root, or /auth/contact if under user router)
    'POST',
    body,
    undefined,
    successMessage,
    errorMessage
  );
