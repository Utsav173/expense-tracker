import { z } from 'zod';
import { AxiosRequestConfig } from 'axios';
import apiFetch from '../api-client';

// --- Helper Types for the Client ---

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
}

// --- The Generic API Client ---

async function apiClient<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
  endpoint: Endpoint<TParams, TQuery, TBody>,
  options?: RequestOptions<TParams, TQuery, TBody>
): Promise<TResponse> {
  let validatedParams: TParams | undefined;
  let validatedQuery: TQuery | undefined;
  let validatedBody: TBody | undefined;

  // 1. Validate request data against schemas
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
      console.error('API Client Validation Error:', error.errors);
      throw new Error(`Invalid request data: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }

  // 2. Construct the URL path
  let path = endpoint.path;
  if (validatedParams) {
    for (const [key, value] of Object.entries(validatedParams as object)) {
      path = path.replace(`:${key}`, String(value));
    }
  }

  // 3. Construct the query string
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

  // 4. Make the API call using the low-level fetcher
  return apiFetch<TResponse>(
    path,
    endpoint.method,
    validatedBody,
    options?.axiosConfig,
    options?.successMessage,
    options?.errorMessage
  );
}

export default apiClient;
