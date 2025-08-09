import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import type { TransactionAPI } from '@/lib/api/api-types';
import { z } from 'zod';

type CreateTransactionBody = z.infer<typeof apiEndpoints.transactions.create.body>;
type BulkCreateBody = z.infer<typeof apiEndpoints.transactions.bulkCreate.body>;
type GetAllParams = z.infer<typeof apiEndpoints.transactions.getAll.query>;
type UpdateTransactionBody = z.infer<typeof apiEndpoints.transactions.update.body>;
type ChartParams = z.infer<typeof apiEndpoints.transactions.getIncomeExpenseChart.query>;

export const transactionCreate = (body: CreateTransactionBody) =>
  apiClient<unknown, unknown, CreateTransactionBody, TransactionAPI.CreateTransactionResponse>(
    apiEndpoints.transactions.create,
    { body }
  );

export const transactionBulkCreate = (
  body: BulkCreateBody
): Promise<TransactionAPI.BulkCreateResponse> =>
  apiClient(apiEndpoints.transactions.bulkCreate, { body });

export const transactionGetAll = (
  params: GetAllParams
): Promise<TransactionAPI.GetTransactionsResponse> =>
  apiClient(apiEndpoints.transactions.getAll, { query: params });

export const transactionGetById = (
  id: string
): Promise<TransactionAPI.GetTransactionByIdResponse> =>
  apiClient(apiEndpoints.transactions.getById, { params: { id } });

export const transactionUpdate = (id: string, body: UpdateTransactionBody) =>
  apiClient<
    { id: string },
    unknown,
    UpdateTransactionBody,
    TransactionAPI.UpdateTransactionResponse
  >(apiEndpoints.transactions.update, { params: { id }, body });

export const transactionDelete = (id: string) =>
  apiClient<{ id: string }, unknown, unknown, TransactionAPI.DeleteTransactionResponse>(
    apiEndpoints.transactions.delete,
    { params: { id } }
  );

export const transactionGetIncomeExpenseChart = (
  params: ChartParams
): Promise<TransactionAPI.GetIncomeExpenseChartDataResponse> =>
  apiClient(apiEndpoints.transactions.getIncomeExpenseChart, { query: params });

export const transactionGetCategoryChart = (
  params: ChartParams
): Promise<TransactionAPI.GetCategoryChartDataResponse> =>
  apiClient(apiEndpoints.transactions.getCategoryChart, { query: params });
