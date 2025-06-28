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
  params: AxiosRequestConfig<any>['params']
): Promise<ApiResponse<{ categories: Category[]; pagination: any }>> =>
  apiFetch(`/category`, 'GET', undefined, { params: params });

export const categoryDelete = (id: string) => apiFetch(`/category/${id}`, 'DELETE');
