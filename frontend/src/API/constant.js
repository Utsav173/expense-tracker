export const BASE_URL = "https://exp-v-4.onrender.com";
// export const BASE_URL = "http://localhost:1337";

export const URL = {
  LOGIN: `${BASE_URL}/auth/login`,
  SIGNUP: `${BASE_URL}/auth/signup`,
  ME: `${BASE_URL}/auth/me`,
  LOGOUT: `${BASE_URL}/auth/logout`,

  GET_DASHBOARD: `${BASE_URL}/accounts/dashboard`,
  GET_ACCOUNTS: `${BASE_URL}/accounts/`,
  SEARCH_ALL: `${BASE_URL}/accounts/searchTerm`,
  CREATE_ACCOUNT: `${BASE_URL}/accounts`,
  UPDATE_ACCOUNT: `${BASE_URL}/accounts/`,
  DELETE_ACCOUNT: `${BASE_URL}/accounts/`,
  GET_ONE_ACCOUNT: `${BASE_URL}/accounts/`,
  GET_PREVIOUS_SHARES: `${BASE_URL}/accounts/previous/share/`,
  USER_DROPDOWN: `${BASE_URL}/accounts/dropdown/user`,
  SHARE_ACC: `${BASE_URL}/accounts/share`,
  GET_SHARE_ACC: `${BASE_URL}/accounts/get-shares`,
  ACC_ANALYTICS: `${BASE_URL}/accounts/customAnalytics/`,
  IMPORT_TRANSACTIONS: `${BASE_URL}/accounts/import/transaction`,
  CONFIRM_IMPORT: `${BASE_URL}/accounts/confirm/import/`,
  GET_SAMPLE_FILE: `${BASE_URL}/accounts/sampleFile/import`,
  EXPORT_STATEMENT: (id) => `${BASE_URL}/accounts/${id}/statement`,

  GET_CATEGORY: `${BASE_URL}/category/`,
  CREATE_CATEGORY: `${BASE_URL}/category/`,
  UPDATE_CATEGORY: `${BASE_URL}/category/`,
  DELETE_CATEGORY: `${BASE_URL}/category/`,

  CREATE_TRANSACTION: `${BASE_URL}/transactions/`,
  GET_TRANSACTIONS: `${BASE_URL}/transactions/`,
  UPDATE_TRANSACTION: `${BASE_URL}/transactions/`,
  DELETE_TRANSACTION: `${BASE_URL}/transactions/`,
  GET_ONE_TRANSACTION: `${BASE_URL}/transactions/`,
  BY_INCOME_EXP: `${BASE_URL}/transactions/by/income/expense`,
  BY_CATEGORY: `${BASE_URL}/transactions/by/category/chart`,
  BY_FIELD: `${BASE_URL}/transactions/by/`,
  BY_I_E_DURATION: `${BASE_URL}/transactions/by/income/expense/chart`,
  GET_FAKEDATA: `${BASE_URL}/transactions/fakeData/by`,
};
