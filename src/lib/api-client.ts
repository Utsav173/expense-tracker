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

    if (config?.responseType === 'blob') {
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^"]*)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      } else if (config?.params?.exportType) {
        filename = `statement.${config.params.exportType}`;
      }

      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (successMessage) {
        toast.success(successMessage);
      }
      return response.data;
    }

    if (successMessage) {
      toast.success(successMessage);
    } else if ((response.data as ApiResponse<T>)?.message) {
      toast.success((response.data as ApiResponse<T>).message || '');
    }

    return response?.data;
  } catch (error: any) {
    let message = 'Something went wrong!';

    if (axios.isAxiosError(error)) {
      if (!error.response) {
        window.location.href = '/auth/login';
        toast.error('Network error. Please check your connection. Redirecting to login.');
        throw new Error('Network error');
      }

      message = error?.response?.data?.message || error.message;
      if (error.response?.status === 401 || error.response?.status === 403) {
        // better-auth handles session invalidation via cookies, no need to manually remove token.
        window.location.href = '/auth/login';
        toast.error('Session expired or unauthorized. Redirecting to login.');
      }
    }

    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.error(message || '');
    }

    throw new Error(message);
  }
};

export default apiFetch;
