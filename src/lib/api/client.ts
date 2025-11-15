import { z } from 'zod';
import { AxiosRequestConfig } from 'axios';
import apiFetch from '../api-client';

interface Endpoint<TParams, TQuery, TBody> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  params?: z.ZodSchema<TParams>;
  query?: z.ZodSchema<TQuery>;
  body?: z.ZodSchema<TBody>;
}

interface RequestOptions<TParams, TQuery, TBody> {
  params?: TParams;
  query?: TQuery;
  body?: TBody;
  axiosConfig?: AxiosRequestConfig;
  successMessage?: string;
  errorMessage?: string;
  signal?: AbortSignal;
}

async function apiClient<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
  endpoint: Endpoint<TParams, TQuery, TBody>,
  options?: RequestOptions<TParams, TQuery, TBody>
): Promise<TResponse> {
  let validatedParams: TParams | undefined;
  let validatedQuery: TQuery | undefined;
  let validatedBody: TBody | undefined;

  try {
    if (endpoint.params && options?.params) {
      validatedParams = endpoint.params.parse(options.params);
    }
    if (endpoint.query && options?.query) {
      validatedQuery = endpoint.query.parse(options.query);
    }
    if (endpoint.body && options?.body) {
      validatedBody = endpoint.body.parse(options.body);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('API Client Validation Error:', error.issues);
      throw new Error(
        `Invalid request data: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`
      );
    }
    throw error;
  }

  let path = endpoint.path;
  if (validatedParams) {
    for (const [key, value] of Object.entries(validatedParams as object)) {
      path = path.replace(`:${key}`, String(value));
    }
  }

  if (validatedQuery) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(validatedQuery as object)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      path += `?${queryString}`;
    }
  }

  const finalAxiosConfig = { ...options?.axiosConfig, signal: options?.signal };

  return apiFetch<TResponse>(
    path,
    endpoint.method,
    validatedBody,
    finalAxiosConfig,
    options?.successMessage,
    options?.errorMessage
  );
}

export default apiClient;
