import apiFetch from '../api-client';

export const investmentCreate = (body: any, successMessage?: string, errorMessage?: string) =>
  apiFetch('/investment', 'POST', body, undefined, successMessage, errorMessage);

export const investmentGetAll = (
  id: string,
  params: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch(`/investment/${id}`, 'GET', undefined, { params }, successMessage, errorMessage);

export const investmentUpdate = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string,
) => apiFetch(`/investment/${id}`, 'PUT', body, undefined, successMessage, errorMessage);

export const investmentDelete = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/investment/${id}`, 'DELETE', undefined, undefined, successMessage, errorMessage);

export const investmentGetDetails = (id: string, successMessage?: string, errorMessage?: string) =>
  apiFetch(`/investment/details/${id}`, 'GET', undefined, undefined, successMessage, errorMessage);

export const investmentUpdateDividend = (
  id: string,
  body: any,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch(
    `/investment/${id}/update-divident`,
    'PUT',
    body,
    undefined,
    successMessage,
    errorMessage,
  );

export const investmentGetPortfolio = (successMessage?: string, errorMessage?: string) =>
  apiFetch('/investment/portfolio', 'GET', undefined, undefined, successMessage, errorMessage);

export const investmentStockSearch = (
  params: any,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch('/investment/stocks/search', 'GET', undefined, { params }, successMessage, errorMessage);

export const investmentStockPrice = (
  symbol: string,
  successMessage?: string,
  errorMessage?: string,
) =>
  apiFetch(
    `/investment/stocks/price/${symbol}`,
    'GET',
    undefined,
    undefined,
    successMessage,
    errorMessage,
  );
