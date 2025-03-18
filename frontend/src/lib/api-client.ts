import axios, { AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

export const API_BASE_URL = 'https://expense-tracker-bun.onrender.com';

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
      message = error?.response?.data?.message || error.message;
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
