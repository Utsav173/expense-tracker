import apiFetch from '../api-client';
import type { AccountAPI } from '@/lib/api/api-types';

export const importTransactions = async (formData: FormData): Promise<AccountAPI.ImportResult> => {
  return apiFetch('/accounts/import/transaction', 'POST', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const confirmImport = async (id: string): Promise<AccountAPI.ConfirmImportResponse> => {
  return apiFetch(`/accounts/confirm/import/${id}`, 'POST');
};

export const getImportData = async (id: string): Promise<AccountAPI.GetImportDataResponse> => {
  return apiFetch(`/accounts/get/import/${id}`, 'GET');
};

export const getSampleFile = async (): Promise<{ message: string; sampleFile: string }> => {
  return apiFetch('/accounts/import/sampleFile', 'GET');
};
