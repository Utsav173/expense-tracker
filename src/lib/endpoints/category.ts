import { AxiosRequestConfig } from 'axios';
import apiFetch from '../api-client';
import { ApiResponse, Category } from '../types';

export const categoryCreate = (
  body: any
): Promise<
  ApiResponse<{
    data: Category;
    message: string;
  }>
> => apiFetch('/category', 'POST', body);

export const categoryUpdate = (id: string, body: any) => apiFetch(`/category/${id}`, 'PUT', body);

export const categoryGetAll = (
  params?:
    | {
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        search?: string;
      }
    | undefined
): Promise<ApiResponse<{ categories: Category[]; pagination: any }>> =>
  apiFetch(`/category`, 'GET', undefined, { params: params });

export const categoryGetById = (id: string): Promise<ApiResponse<{ data: Category }>> =>
  apiFetch(`/category/${id}`, 'GET');

export const categoryDelete = (id: string) => apiFetch(`/category/${id}`, 'DELETE');
