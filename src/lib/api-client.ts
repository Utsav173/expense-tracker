import axios, { AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => config);

interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number | string;
}

const downloadBlob = (blob: Blob, contentDisposition?: string, exportType?: string): void => {
  let filename = 'download';

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^"]*)"?/);
    if (filenameMatch?.[1]) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  } else if (exportType) {
    filename = `statement.${exportType}`;
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // More efficient DOM manipulation
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const handleApiError = (error: any, errorMessage?: string): never => {
  let message = 'Something went wrong!';

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      toast.error('Network error. Please check your connection. Redirecting to login.');
      window.location.href = '/auth/login';
      throw new Error('Network error');
    }

    message = error.response.data?.message || error.message;

    // Handle auth errors
    if (error.response.status === 401 || error.response.status === 403) {
      toast.error('Session expired or unauthorized. Redirecting to login.');
      window.location.href = '/auth/login';
      throw new Error('Session expired or unauthorized');
    }
  }

  toast.error(errorMessage || message);
  throw new Error(message);
};

const apiFetch = async <T>(
  url: string,
  method: AxiosRequestConfig['method'],
  body?: any,
  config?: AxiosRequestConfig,
  successMessage?: string,
  errorMessage?: string
): Promise<T> => {
  try {
    const response = await api.request<T>({
      url,
      method,
      data: body,
      responseType: config?.responseType || 'json',
      ...config
    });

    // Handle blob downloads
    if (config?.responseType === 'blob') {
      downloadBlob(
        response.data as Blob,
        response.headers['content-disposition'],
        config.params?.exportType
      );

      if (successMessage) {
        toast.success(successMessage);
      }
      return response.data;
    }

    // Handle success messages more efficiently
    const responseData = response.data as ApiResponse<T>;
    const messageToShow = successMessage || responseData?.message;

    if (messageToShow) {
      toast.success(messageToShow);
    }

    return response.data;
  } catch (error: any) {
    return handleApiError(error, errorMessage);
  }
};

export default apiFetch;
