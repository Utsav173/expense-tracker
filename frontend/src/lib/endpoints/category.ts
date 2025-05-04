import { AxiosRequestConfig } from 'axios';
import apiFetch from '../api-client';
import { ApiResponse, Category } from '../types';

export const categoryCreate = (
  body: any,
  successMessage?: string,
  errorMessage?: string
): Promise<
  ApiResponse<{
    data: Category;
    message: string;
  }>
> => apiFetch('/category', 'POST', body, undefined, successMessage, errorMessage);

export const categoryUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string
) => apiFetch(`/category/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const categoryGetAll = (
  params: AxiosRequestConfig<any>['params'],
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<{ categories: Category[]; pagination: any }>> =>
  apiFetch(`/category`, 'GET', undefined, { params: params }, successMessage, errorMessage);

export const categoryDelete = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/category/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);
