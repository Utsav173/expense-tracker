import apiFetch from '../api-client';

export const importTransactions = async (formData: FormData) => {
  return apiFetch<{ message: string; successId: string; totalRecords: number }>(
    '/accounts/import/transaction',
    'POST',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
};

//confirm import
export const confirmImport = async (id: string) => {
  return apiFetch<{ message: string }>(
    `/accounts/confirm/import/${id}`,
    'POST',
    undefined,
    undefined,
    'Data imported successfully',
    'Failed to import data'
  );
};

//get import data
export const getImportData = async (id: string) => {
  return apiFetch<{ length: number; data: any[] }>(`/accounts/get/import/${id}`, 'GET');
};

export const getSampleFile = async () => {
  return apiFetch<{ message: string; sampleFile: string }>(
    '/accounts/import/sampleFile',
    'GET',
    undefined,
    undefined,
    'Sample file downloaded successfully',
    'Failed to download sample file'
  );
};
