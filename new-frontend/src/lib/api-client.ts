import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:1337';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ApiResponse<T> = AxiosResponse<T> | any;

const apiFetch = async <T>(
  url: string,
  method: AxiosRequestConfig['method'],
  body?: any,
  config?: AxiosRequestConfig,
  successMessage?: string,
  errorMessage?: string,
): Promise<T> => {
  try {
    const response: ApiResponse<T> = await api.request({
      url,
      method,
      data: body,
      ...config,
    });

    if (successMessage) {
      toast.success(successMessage);
    } else {
      toast.success('Operation success!');
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
