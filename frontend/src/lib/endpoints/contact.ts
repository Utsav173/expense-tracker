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
  apiFetch('/contact', 'POST', body, undefined, successMessage, errorMessage);
