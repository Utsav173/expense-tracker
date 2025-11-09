// =================================================================
// Generic & Reusable Types
// =================================================================

export interface Pagination {
  total: number;
  totalPages: number;
  currentPage?: number;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface SimpleUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface SuccessMessage {
  message: string;
}

export interface SuccessMessageWithData<T> {
  message: string;
  data: T;
}

// =================================================================
// Namespace-grouped API Types
// =================================================================

export namespace AccountAPI {
  export interface Account {
    id: string;
    name: string;
    balance: number;
    createdAt: string;
    updatedAt: string | null;
    currency: string;
    owner: SimpleUser;
    analytics: {
      income: number;
      expense: number;
      incomePercentageChange: number;
      expensesPercentageChange: number;
    };
    isDefault: boolean;
  }

  export interface AccountDropdown {
    id: string;
    name: string;
    currency: string;
  }

  export interface SimpleAccount {
    id: string;
    name: string;
    currency: string;
  }

  export interface DashboardData {
    accountsInfo: {
      id: string;
      name: string;
      balance: number;
      income: number;
      expense: number;
      currency: string;
    }[];
    transactionsCountByAccount: Record<string, number>;
    totalTransaction: number;
    mostExpensiveExpense: number;
    cheapestExpense: number;
    mostExpensiveIncome: number;
    cheapestIncome: number;
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

  export interface ImportDataReview {
    length: number;
    data: any[];
    accountId: string;
    totalRecords: number;
    errorRecords: number;
    isImported: boolean;
    createdAt: string;
  }

  export interface ImportResult {
    message: string;
    successId: string;
    totalRecords: number;
  }

  export interface GetAccountById extends Account {
    oldestTransactionDate: string | null;
    recentDateAsToday: string;
  }

  export type GetDashboardResponse = DashboardData;
  export type SearchTransactionsResponse = TransactionAPI.Transaction[];
  export type GetUsersForDropdownResponse = SimpleUser[];
  export type GetSharedAccountsResponse = { data: Account[]; pagination: Pagination };
  export type GetPreviousSharesResponse = SimpleUser[];
  export type GetImportDataResponse = ImportDataReview;
  export type ConfirmImportResponse = SuccessMessage;
  export type GetCustomAnalyticsResponse = CustomAnalytics;
  export type GetAccountsResponse = { accounts: Account[]; pagination: Pagination };
  export type GetAccountListSimpleResponse = SimpleAccount[];
  export type GetAccountByIdResponse = GetAccountById;
  export type CreateAccountResponse = SuccessMessageWithData<Account>;
  export type UpdateAccountResponse = SuccessMessage;
  export type DeleteAccountResponse = SuccessMessage;
  export type ShareAccountResponse = SuccessMessage;
  export type RevokeShareResponse = SuccessMessage;
}

export namespace TransactionAPI {
  export interface Category {
    id: string;
    name: string;
  }

  export interface Transaction {
    id: string;
    amount: number;
    category: Category | null;
    text: string;
    isIncome: boolean;
    account: string;
    transfer: string | null;
    createdAt: string;
    createdBy: SimpleUser;
    updatedBy: SimpleUser | null;
    updatedAt: string | null;
    recurring: boolean;
    recurrenceType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'hourly' | null;
    recurrenceEndDate: string | null;
    currency: string;
  }

  export interface GetTransactionByIdResponse {
    transaction: Transaction;
    generatedInstancesCount?: number;
    remainingInstancesCount?: number;
    template?: Transaction;
  }

  export interface CategoryChartData {
    name: string[];
    totalIncome: number[];
    totalExpense: number[];
  }

  export interface IncomeExpenseTotals {
    income: number;
    expense: number;
  }

  export interface IncomeExpenseChartData {
    date: string[];
    income: number[];
    expense: number[];
    balance: number[];
  }

  export type GetTransactionsResponse = {
    transactions: Transaction[];
    pagination: Pagination;
    filters: any;
    dateRange: { minDate: string | null; maxDate: string | null };
  };
  export type CreateTransactionResponse = SuccessMessageWithData<Transaction>;
  export type UpdateTransactionResponse = SuccessMessageWithData<Transaction>;
  export type DeleteTransactionResponse = SuccessMessage & { id: string };
  export type BulkCreateResponse = { message: string; created: number; skipped: number };
  export type GetCategoryChartDataResponse = CategoryChartData;
  export type GetIncomeExpenseTotalsResponse = IncomeExpenseTotals;
  export type GetIncomeExpenseChartDataResponse = IncomeExpenseChartData;
}

export type providersIds = 'google' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'qwen' | null;

export namespace UserAPI {
  export interface UserProfile {
    id: string;
    name: string;
    email: string;
    image: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    preferredCurrency: string | null;
    role: 'user' | 'admin';
    hasAiApiKey: boolean;
  }

  export interface UserPreferences {
    preferredCurrency: string | null;
  }

  export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    ai: {
      providerId: providersIds;
      modelId: string | null;
      providerOptions?: {
        temperature?: number;
        google?: {
          safetySettings?: Array<{
            category: string;
            threshold: string;
          }>;
        };
        openai?: {};
      };
    };
    notifications: {
      enableAll: boolean;
      budgetAlerts: boolean;
      goalReminders: boolean;
      billReminders: boolean;
    };
    hasAiApiKey: boolean;
  }

  export type GetMeResponse = UserProfile;
  export type GetPreferencesResponse = UserPreferences;
  export type UpdateUserResponse = SuccessMessageWithData<Partial<UserProfile>>;
  export type UpdatePreferencesResponse = SuccessMessage;
  export type GetSettingsResponse = UserSettings;
  export type UpdateSettingsResponse = SuccessMessageWithData<UserSettings>;
  export type UpdateApiKeyResponse = SuccessMessage;
}

export namespace CategoryAPI {
  export interface Category {
    id: string;
    name: string;
    owner: string | null;
  }
  export type GetCategoriesResponse = { categories: Category[]; pagination: Pagination };
  export type GetCategoryResponse = SuccessMessageWithData<Category>;
  export type CreateCategoryResponse = SuccessMessageWithData<Category>;
  export type UpdateCategoryResponse = SuccessMessage;
  export type DeleteCategoryResponse = SuccessMessage;
}

export namespace BudgetAPI {
  export interface Budget {
    id: string;
    createdAt: string;
    updatedAt: string | null;
    userId: string;
    category: { id: string; name: string };
    month: number;
    year: number;
    amount: number;
  }
  export interface BudgetSummary {
    category: string;
    categoryName: string;
    budgetedAmount: number;
    actualSpend: number;
  }
  export interface BudgetProgress {
    budgetId: string;
    categoryName: string;
    budgetedAmount: number;
    totalSpent: number;
    remainingAmount: number;
    progress: number;
  }
  export type GetBudgetsResponse = PaginatedResponse<Budget>;
  export type CreateBudgetResponse = SuccessMessageWithData<Budget>;
  export type UpdateBudgetResponse = SuccessMessage & { id: string };
  export type DeleteBudgetResponse = SuccessMessage;
  export type GetBudgetSummaryResponse = BudgetSummary[];
  export type GetBudgetProgressResponse = BudgetProgress;
}

export namespace GoalAPI {
  export interface SavingGoal {
    id: string;
    createdAt: string;
    updatedAt: string | null;
    userId: string;
    name: string;
    targetAmount: number;
    savedAmount: number | null;
    targetDate: string | null;
  }
  export type GetGoalsResponse = PaginatedResponse<SavingGoal>;
  export type CreateGoalResponse = SuccessMessageWithData<SavingGoal>;
  export type UpdateGoalResponse = SuccessMessage & { id: string };
  export type AddAmountResponse = SuccessMessage & { id: string; newSavedAmount: number | null };
  export type WithdrawAmountResponse = AddAmountResponse;
  export type DeleteGoalResponse = SuccessMessage;
  export type GetGoalsDropdownResponse = {
    id: string;
    name: string;
  }[];
}

export namespace DebtAndInterestAPI {
  export interface InterestCalculation {
    interest: number;
    totalAmount: number;
  }
  export interface AmortizationPayment {
    date: string; // ISO
    status: 'settled' | 'due' | 'upcoming';
    installmentAmount: number;
    principalForPeriod: number;
    interestForPeriod: number;
    remainingPrincipal: number;
    cumulativePrincipalPaid: number;
    cumulativeInterestPaid: number;
  }
  export interface Debt {
    id: string;
    createdAt: string;
    updatedAt: string | null;
    amount: number;
    createdBy: string;
    description: string | null;
    interestRate: number;
    isPaid: boolean | null;
    userId: string;
    type: 'given' | 'taken';
    interestType: 'simple' | 'compound';
    account: string | null;
    startDate: string;
    termLength: number;
    termUnit: 'days' | 'weeks' | 'months' | 'years';
    paymentFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    finalDueDate: string; // ISO
  }
  export interface DebtRecord {
    debts: Debt;
    account: { id: string; name: string; currency: string } | null;
    user: SimpleUser | null;
  }
  export type CalculateInterestResponse = InterestCalculation;
  export type GetDebtScheduleResponse = AmortizationPayment[];
  export type CreateDebtResponse = SuccessMessageWithData<Debt>;
  export type GetDebtsResponse = PaginatedResponse<DebtRecord> & {
    totalCount: number;
    currentPage: number;
  };
  export type UpdateDebtResponse = SuccessMessage;
  export type DeleteDebtResponse = SuccessMessage;
  export type MarkDebtAsPaidResponse = SuccessMessage;
}

export namespace InvestmentAccountAPI {
  export interface InvestmentAccount {
    id: string;
    createdAt: string;
    updatedAt: string | null;
    userId: string;
    name: string;
    platform: string | null;
    balance: number | null;
    currency: string;
    oldestInvestmentDate?: string;
  }
  export interface InvestmentAccountSummary {
    accountId: string;
    accountname: string;
    currency: string;
    platform: string | null;
    totalInvestment: number;
    totaldividend: number;
    totalvalue: number;
  }
  export type GetInvestmentAccountsResponse = PaginatedResponse<InvestmentAccount>;
  export type GetSummaryResponse = InvestmentAccountSummary;
  export type GetByIdResponse = InvestmentAccount & { oldestInvestmentDate: string | null };
  export type CreateResponse = SuccessMessageWithData<InvestmentAccount>;
  export type UpdateResponse = SuccessMessage & { id: string };
  export type DeleteResponse = SuccessMessage;
  export type GetPerformanceResponse = InvestmentAPI.HistoricalPortfolioResult;
}

export namespace InvestmentAPI {
  export interface StockSearchResult {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  }
  export interface StockPriceResult {
    symbol: string;
    price: number;
    change: number | null;
    changePercent: number | null;
    exchange: string;
    currency: string;
    companyName: string;
    marketState: string;
    regularMarketTime: string | null;
  }
  export interface HistoricalPriceResult {
    symbol: string;
    date: string;
    price: number | null;
    currency: string;
    exchange: string;
    companyName: string;
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
  export interface HistoricalPortfolioPoint {
    date: string;
    value: number;
  }
  export interface HistoricalPortfolioResult {
    data: HistoricalPortfolioPoint[];
    currency: string;
    valueIsEstimate: boolean;
  }
  export interface Investment {
    id: string;
    createdAt: string;
    updatedAt: string | null;
    account: string;
    symbol: string;
    shares: number | null;
    purchasePrice: number | null;
    purchaseDate: string | null;
    dividend: number | null;
    investedAmount: number | null;
  }
  export interface InvestmentPerformance {
    investmentDetails: Investment;
    currentMarketData: StockPriceResult | null;
    marketPerformance: { date: string; value: number | null }[];
    holdingPerformance: { date: string; holdingValue: number; gainLoss: number }[];
  }
  export type GetOldestDateResponse = { oldestDate: string | null };
  export type GetPortfolioSummaryResponse = PortfolioSummary;
  export type SearchStocksResponse = StockSearchResult[];
  export type GetStockPriceResponse = StockPriceResult;
  export type GetHistoricalStockPriceResponse = HistoricalPriceResult;
  export type GetHistoricalPortfolioResponse = HistoricalPortfolioResult;
  export type GetPerformanceResponse = InvestmentPerformance;
  export type GetDetailsResponse = { investment: Investment };
  export type UpdateDividendResponse = SuccessMessage & { id: string };
  export type GetInvestmentsForAccountResponse = PaginatedResponse<Investment>;
  export type UpdateInvestmentResponse = SuccessMessage & { id: string };
  export type DeleteInvestmentResponse = SuccessMessage;
  export type CreateInvestmentResponse = SuccessMessageWithData<Investment>;
}

export namespace InvitationAPI {
  export interface Invitation {
    id: string;
    createdAt: string;
    updatedAt: string | null;
    inviterId: string;
    inviteeEmail: string;
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    expiresAt: string;
  }
  export type CreateInvitationResponse = SuccessMessageWithData<{ invitation: Invitation }>;
  export type VerifyInvitationResponse = SuccessMessageWithData<{ invitation: Invitation }>;
}

export namespace AIAPI {
  export interface AIResponse {
    response: string;
    sessionId: string;
  }

  export interface ExtractedTransaction {
    date: string;
    description: string;
    debit?: number;
    credit?: number;
    category: string;
    transfer?: string;
  }
  export interface FinancialHealthAnalysis {
    score: number;
    highlights: { emoji: string; statement: string }[];
    improvements: { emoji: string; statement: string }[];
    recommendations: { title: string; description: string }[];
  }

  export interface AIModel {
    id: string;
    name: string;
    provider: string;
    description?: string;
  }

  export interface AIProvider {
    id: 'google' | 'openai' | 'anthropic' | 'groq' | 'deepseek';
    name: string;
    docsUrl: string;
    models: AIModel[];
  }

  export type ProcessPdfResponse = { transactions: ExtractedTransaction[] };
  export type GetFinancialHealthResponse = FinancialHealthAnalysis;
  export type GetProvidersResponse = AIProvider[];
}

export namespace AdminAPI {
  export interface AdminUserView {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  }
  export type GetAllUsersResponse = AdminUserView[];
}

export namespace ContactAPI {
  export type SubmitContactFormResponse = SuccessMessage;
}
