import axios, { AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    const response: ApiResponse<T> = await api.request({
      url,
      method,
      data: body,
      ...config
    });

    if (successMessage) {
      toast.success(successMessage);
    } else if (response?.message) {
      toast.success(response.message);
    }

    return response?.data;
  } catch (error: any) {
    let message = 'Something went wrong!';

    if (axios.isAxiosError(error)) {
      if (!error.response) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
        toast.error('Network error. Please check your connection. Redirecting to login.');
        throw new Error('Network error');
      }

      message = error?.response?.data?.message || error.message;
      if (error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
        toast.error('Unauthorized or Server Error. Redirecting to login.');
      }
    }

    if (errorMessage) {
      toast.error(errorMessage);
    } else {
      toast.error(message);
    }

    throw new Error(message);
  }
};

export default apiFetch;
