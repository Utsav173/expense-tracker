// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  token?: string;
  isSocial: boolean;
  profilePic: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  resetPasswordToken?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  preferredCurrency: string | null;
  hasAiApiKey?: boolean;
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

export interface CategoryPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryListData {
  categories: Category[];
  pagination: CategoryPagination;
}

export type CategoryListResponse = ApiResponse<CategoryListData>;

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
  createdBy: User;
  updatedBy?: string;
  owner: string;
  createdAt: string;
  updatedAt?: string;
  currency: string;
  recurring?: boolean;
  recurrenceType?: string;
  recurrenceEndDate?: string;
}

export interface TransactionWithContext {
  transaction: Transaction;
  generatedInstancesCount?: number;
  remainingInstancesCount?: number;
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
  oldestTransactionDate?: Date | null;
  recentDateAsToday?: Date | null;
}

export interface AccountDropdown {
  id: string;
  name: string;
  currency: string;
  balance?: number;
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
  oldestInvestmentDate?: Date;
}

// Investment Interface
export interface Investment {
  id: string;
  account: string;
  symbol: string;
  shares: number | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  dividend: number | null;
  investedAmount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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
    income: number | null;
    expense: number | null;
    currency: string;
  }[];
  transactionsCountByAccount: Record<string, number>;
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
  name: string;
  email: number;
  profilePic?: string | null;
};

export type DropdownUser = {
  id: string;
  name: string;
  email: string;
  profilePic: string | null;
};

export type TransactionsResponse = ApiResponse<{
  transactions: Transaction[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  filters: {
    sortBy: string;
    sortOrder: string;
    q: string;
  };
  dateRange: {
    minDate: string;
    maxDate: string;
  };
}>;

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export interface BudgetSummaryItem {
  category: string;
  categoryName: string;
  budgetedAmount: number;
  actualSpend: number;
}

export interface PortfolioItem {
  accountName: string;
  currency: string;
  totalInvestment: number;
  totalDividend: number;
  totalShares: number;
}

export interface PortfolioSummary {
  totalInvestedAmount: number;
  currentMarketValue: number;
  totalDividends: number;
  overallGainLoss: number;
  overallGainLossPercentage: number;
  numberOfAccounts: number;
  numberOfHoldings: number;
  currency: string;
  valueIsEstimate: boolean;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface StockPriceResult {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  exchange: string;
  currency: string;
  companyName: string;
  marketState: string;
  regularMarketTime: string | null;
}

export interface InvestmentAccountSummary {
  accountname: string;
  currency: string;
  platform: string | null;
  totalinvestment: number;
  totaldividend: number;
  totalvalue: number;
}

export interface DebtWithDetails {
  debts: Debts;
  account: Account | null;
  user: User | null;
}

export interface HistoricalStockPriceResponse {
  symbol: string;
  date: string;
  price: number;
  currency: string;
  exchange: string;
  companyName: string;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface ParsedTransactionFromAI {
  date: string;
  description: string;
  category: string;
  debit?: number | undefined;
  credit?: number | undefined;
  transfer?: string | undefined;
}

export interface AiProcessRequest {
  prompt: string;
  sessionId?: string;
}

export interface AiProcessResponse {
  response: string;
  sessionId: string;
  toolCalls?: any[];
  toolResults?: any[];
}

export interface AiProcessPdfRequest {
  documentContent: string;
}

export interface AiProcessPdfResponse {
  transactions: ParsedTransactionFromAI[];
}

export interface Payment {
  id: string;
  date: Date;
  status: 'settled' | 'due' | 'upcoming';
  installmentAmount: number;
  principalForPeriod: number;
  interestForPeriod: number;
  cumulativePrincipalPaid: number;
  cumulativeInterestPaid: number;
  remainingPrincipal: number;
  totalPrincipalPaid?: number;
  totalInterestPaid?: number;
}

export interface InvestmentPerformanceData {
  investmentDetails: Investment;
  currentMarketData: StockPriceResult | null;
  marketPerformance: { date: string; value: number | null }[];
  holdingPerformance: { date: string; holdingValue: number; gainLoss: number }[];
}
