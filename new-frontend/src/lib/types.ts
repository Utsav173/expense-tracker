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
}

// Account Interface
export interface Account {
  id: string;
  name: string;
  owner: string;
  balance: number;
  createdAt: string;
  updatedAt?: string;
  isDefault: boolean;
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
}

export type ApiResponse<T> = T | null;
