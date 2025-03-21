// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  token?: string;
  isSocial: boolean;
  profilePic: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  resetPasswordToken?: string;
  createdAt: string;
  updatedAt?: string;
  preferredCurrency: string;
}

// Analytics Interface
export interface Analytics {
  id: string;
  account: string;
  user: string;
  income: number;
  expense: number;
  balance: number;
  previousIncome: number;
  previousExpenses: number;
  previousBalance: number;
  incomePercentageChange: number;
  expensesPercentageChange: number;
  createdAt: string;
  updatedAt?: string;
}

// Category Interface
export interface Category {
  id: string;
  name: string;
  owner?: string;
  createdAt: string;
  updatedAt?: string;
}

// Debts Interface
export interface Debts {
  id: string;
  amount: number;
  premiumAmount: number;
  createdBy: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  duration?: string;
  percentage: number;
  frequency?: string;
  isPaid: boolean;
  userId: string;
  type: string;
  interestType: string;
  account?: string;
}

// ImportData Interface
export interface ImportData {
  id: string;
  account: string;
  user: string;
  data: string;
  totalRecords: number;
  errorRecords: number;
  isImported: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Transaction Interface
export interface Transaction {
  id: string;
  text: string;
  amount: number;
  isIncome: boolean;
  transfer?: string;
  category?: Category;
  account: string;
  createdBy: string;
  updatedBy?: string;
  owner: string;
  createdAt: string;
  updatedAt?: string;
  currency: string;
}

// Account Interface
export interface Account {
  id: string;
  name: string;
  owner: User;
  balance: number;
  createdAt: string;
  updatedAt?: string;
  isDefault: boolean;
  currency: string;
  analytics?: Analytics;
}

export interface AccountDetails {
  id: string;
  name: string;
  balance: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  owner: {
    id: string;
    name: string;
    email: string;
    profilePic: string | null;
  } | null;
  analytics: Analytics | null;
  currency: string;
}

export interface AccountDropdown {
  id: string;
  name: string;
  currency: string;
}

// UserAccount Interface
export interface UserAccount {
  userId: string;
  accountId: string;
  id: string;
  createdAt: string;
  updatedAt?: string;
}

// Budget Interface
export interface Budget {
  id: string;
  userId: string;
  category: Category;
  month: number;
  year: number;
  amount: number;
  createdAt: string;
  updatedAt?: string;
}

// InvestmentAccount Interface
export interface InvestmentAccount {
  id: string;
  userId: string;
  name: string;
  platform?: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

// Investment Interface
export interface Investment {
  id: string;
  account: string;
  symbol: string;
  shares?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  dividend: number;
  investedAmount: number;
  createdAt: string;
  updatedAt?: string;
}

// SavingGoal Interface
export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LoginResponse {
  data: {
    token: string;
    user: User;
  };
  error?: {
    message: string;
  };
}

export type ApiResponse<T> = T | null;

export interface DashboardData {
  accountsInfo: {
    id: string;
    name: string;
    balance: number;
    income: number | null; // Make optional, as in initial stage it may contains NULL values.
    expense: number | null;
    currency: string; //added explicitly.
  }[];
  transactionsCountByAccount: Record<string, number>; // Object with account names as keys, counts as values
  totalTransaction: number;
  mostExpensiveExpense: number | null;
  cheapestExpense: number | null;
  mostExpensiveIncome: number | null;
  cheapestIncome: number | null;
  incomeChartData: { x: number; y: number }[];
  expenseChartData: { x: number; y: number }[];
  balanceChartData: { x: number; y: number }[];
  overallIncome: number;
  overallExpense: number;
  overallBalance: number;
  overallIncomeChange: number;
  overallExpenseChange: number;
}

export interface CustomAnalytics {
  income: number;
  expense: number;
  balance: number;
  BalancePercentageChange: number;
  IncomePercentageChange: number;
  ExpensePercentageChange: number;
}

export interface IncomeExpenseChartData {
  date: string[];
  income: number[];
  expense: number[];
  balance: number[];
}

export type ChartDataType = {
  date: string;
  income: number;
  expense: number;
  balance: number;
};

export type PreviousShareAccount = {
  id: string;
  name: string | null;
  balance: number | null;
  User: {
    id: string;
    name: string;
    email: string;
    profilePic: string | null;
  } | null;
};

export type DropdownUser = {
  id: string;
  name: string;
  email: string;
  profilePic: string | null;
};

export type TransactionsResponse = ApiResponse<{
  transactions: Transaction[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}>;
