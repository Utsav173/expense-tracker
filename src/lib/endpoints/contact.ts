import apiFetch from '../api-client';
import type { ContactAPI } from '@/lib/api/api-types';

interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const submitContactForm = (
  body: ContactFormPayload
): Promise<ContactAPI.SubmitContactFormResponse> => apiFetch('/contact', 'POST', body);
