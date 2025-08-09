import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { CategoryAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type CreateCategoryBody = z.infer<typeof apiEndpoints.category.create.body>;
type UpdateCategoryBody = z.infer<typeof apiEndpoints.category.update.body>;
type GetAllParams = z.infer<typeof apiEndpoints.category.getAll.query>;

export const categoryCreate = (body: CreateCategoryBody) =>
  apiClient<unknown, unknown, CreateCategoryBody, CategoryAPI.CreateCategoryResponse>(
    apiEndpoints.category.create,
    { body }
  );

export const categoryUpdate = (id: string, body: UpdateCategoryBody) =>
  apiClient<{ id: string }, unknown, UpdateCategoryBody, CategoryAPI.UpdateCategoryResponse>(
    apiEndpoints.category.update,
    { params: { id }, body }
  );

export const categoryGetAll = (params?: GetAllParams): Promise<CategoryAPI.GetCategoriesResponse> =>
  apiClient(apiEndpoints.category.getAll, { query: params });

export const categoryGetById = (id: string): Promise<CategoryAPI.GetCategoryResponse> =>
  apiClient(apiEndpoints.category.getById, { params: { id } });

export const categoryDelete = (id: string) =>
  apiClient<{ id: string }, unknown, unknown, CategoryAPI.DeleteCategoryResponse>(
    apiEndpoints.category.delete,
    { params: { id } }
  );
