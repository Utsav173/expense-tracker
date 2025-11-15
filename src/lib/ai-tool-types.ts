import { z } from 'zod';
import { InferUITools } from 'ai';


const tools = {
  createAccount: {
    inputSchema: z.object({
      accountName: z.string().min(1).describe("The desired name for the new account (e.g., 'ICICI Salary', 'Paytm Wallet'). Example: \"My Savings Account\""),
      initialBalance: z.number().optional().default(0).describe('The starting balance (defaults to 0). Must be non-negative. Example: 1000.50'),
      currency: z.string().length(3).optional().default('INR').describe('The 3-letter currency code (e.g., INR, USD). Defaults to user\'s preferred currency or INR. Example: "INR"'),
    }),
  },
  addTransaction: {
    inputSchema: z.object({
      text: z.string().describe('A description of the transaction.'),
      amount: z.number().describe('The amount of the transaction.'),
      isIncome: z.boolean().describe('True if the transaction is income, false if it is an expense.'),
      category: z.string().optional().describe('The category of the transaction.'),
      account: z.string().describe('The ID or name of the account the transaction belongs to.'),
      currency: z.string().optional().describe('The currency of the transaction.'),
    }),
  },
  searchStockSymbols: {
    inputSchema: z.object({
      query: z.string().min(1).describe('The stock symbol or company name to search for.'),
    }),
  },
  convertCurrency: {
    inputSchema: z.object({
      amount: z.number().describe('The amount to convert.'),
      fromCurrency: z.string().length(3).describe('The 3-letter code of the source currency (e.g., "USD").'),
      toCurrency: z.string().length(3).describe('The 3-letter code of the target currency (e.g., "INR").'),
    }),
  },
  identifyAccountForAction: {
    inputSchema: z.object({
      accountIdentifier: z.string().min(1).describe('The name or ID of the account. Example: "Savings Account" or "acc_abc456"'),
    }),
  },
  executeConfirmedDeleteAccount: {
    inputSchema: z.object({
      accountId: z.string().describe('The exact unique ID of the account to delete (obtained from the identification step). Example: "acc_xyz789"'),
    }),
  },
  executeConfirmedUpdateAccountName: {
    inputSchema: z.object({
      accountId: z.string().describe('The unique ID of the account to rename (obtained from the identification step). Example: "acc_xyz789"'),
      newAccountName: z.string().min(1).describe('The desired new name for the account. Example: "My New Bank Account"'),
    }),
  },
  createBudget: {
    inputSchema: z.object({
      categoryIdentifier: z.string().min(1).describe('The name or ID of the expense category to set the budget for. Example: "Groceries" or "cat_abc123"'),
      amount: z.number().positive('Budget amount. Example: 500'),
      month: z.number().int().min(1).max(12).optional().describe('The month number (1-12). Defaults to the current month if omitted. Example: 7 for July'),
      year: z.number().int().min(1900).max(2100).optional().describe('The full year (e.g., 2024). Defaults to the current year if omitted. Example: 2024'),
    }),
  },
  identifyBudgetForAction: {
    inputSchema: z.object({
      categoryIdentifier: z.string().min(1).describe('The name or ID of the budget\'s category. Example: "Rent" or "cat_ghi789"'),
      month: z.number().int().min(1).max(12).describe('The month of the budget (1-12). Example: 1 for January'),
      year: z.number().int().min(1900).max(2100).describe('The year of the budget (e.g., 2024). Example: 2023'),
    }),
  },
  executeConfirmedUpdateBudget: {
    inputSchema: z.object({
      budgetId: z.string().describe('The exact unique ID of the budget to update, obtained from user confirmation.'),
      newAmount: z.number().positive('The new positive numerical amount for the budget. Example: 750.00'),
    }),
  },
  executeConfirmedDeleteBudget: {
    inputSchema: z.object({
      budgetId: z.string().describe('The exact unique ID of the budget to delete, obtained from user confirmation.'),
    }),
  },
  createCategory: {
    inputSchema: z.object({
      categoryName: z.string().min(1).describe("The name for the new category (e.g., 'Freelance Income', 'Office Lunch')."),
    }),
  },
  identifyCategoryForAction: {
    inputSchema: z.object({
      categoryIdentifier: z.string().min(1).describe('The name or ID of the custom category. Example: "Groceries" or "cat_abc123"'),
    }),
  },
  executeConfirmedDeleteCategory: {
    inputSchema: z.object({
      categoryId: z.string().describe('The exact unique ID of the category to delete (obtained from identification step). Example: "cat_xyz789"'),
    }),
  },
  executeConfirmedUpdateCategoryName: {
    inputSchema: z.object({
      categoryId: z.string().describe('The unique ID of the custom category to rename (obtained from identification step). Example: "cat_xyz789"'),
      newCategoryName: z.string().min(1).describe('The desired new name. Example: "New Category Name"'),
    }),
  },
  addDebt: {
    inputSchema: z.object({
      amount: z.number().positive('Principal loan amount. Example: 5000'),
      type: z.enum(['given', 'taken']).describe("'given' (lent) or 'taken' (borrowed)."),
      involvedUserIdentifier: z.string().min(1).describe('Name or email of the other person involved.'),
      description: z.string().optional().describe('Brief description of the loan.'),
      interestRate: z.number().nonnegative().optional().default(0).describe('Annual interest rate % (e.g., 5.5).'),
      interestType: z.enum(['simple', 'compound']).default('simple').describe('Interest calculation type.'),
      accountIdentifier: z.string().min(1).describe('Name or ID of the associated bank account.'),
      termLength: z.number().int().positive("The number of units for the loan's term (e.g., 12 for 12 months)."),
      termUnit: z.enum(['days', 'weeks', 'months', 'years']).describe("The unit for the loan's term."),
      paymentFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).describe('How often payments are due.'),
      startDateDescription: z.string().optional().describe("When the loan starts (e.g., 'today', 'last Monday'). Defaults to today."),
    }),
  },
  markDebtAsPaid: {
    inputSchema: z.object({
      debtIdentifier: z.string().min(1).describe('Information to identify the debt (e.g., \'loan from john\'). Example: "loan to Sarah" or "debt_abc123"'),
    }),
  },
  executeConfirmedMarkDebtPaid: {
    inputSchema: z.object({
      debtId: z.string().describe('The exact unique ID of the debt to mark paid. Example: "debt_abc123"'),
    }),
  },
  identifyDebtForAction: {
    inputSchema: z.object({
      debtIdentifier: z.string().min(1).describe('Information to identify the debt (e.g., \'loan from john\'). Example: "loan from Jane" or "debt_def456"'),
    }),
  },
  executeConfirmedUpdateDebt: {
    inputSchema: z.object({
      debtId: z.string().describe('Exact unique ID of the debt.'),
      newDescription: z.string().optional().describe('New description for the loan.'),
      newTermLength: z.number().int().positive().optional().describe('New term length (e.g., 24 for 24 months).'),
      newTermUnit: z.enum(['days', 'weeks', 'months', 'years']).optional().describe('New unit for the term.'),
      newInterestRate: z.number().nonnegative().optional().describe('New annual interest rate (e.g., 7.5).'),
    }),
  },
  executeConfirmedDeleteDebt: {
    inputSchema: z.object({
      debtId: z.string().describe('Exact unique ID of the debt to delete. Example: "debt_ghi789"'),
    }),
  },
  parseNaturalLanguageDateRange: {
    inputSchema: z.object({
      dateDescription: z.string().min(1).describe("A description of the date range to parse (e.g., 'next week', 'January 2022', 'last Tuesday')."),
    }),
  },
  getHistoricalStockPriceOnDate: {
    inputSchema: z.object({
      symbol: z.string().min(1).describe('The Indian stock symbol (e.g., "RELIANCE.NS", "ITC.BO").'),
      dateDescription: z.string().min(1).describe('The specific date or natural language description for the historical price (e.g., "2023-10-26", "yesterday").'),
    }),
  },
  getHistoricalStockPriceRange: {
    inputSchema: z.object({
      symbol: z.string().min(1).describe('The Indian stock symbol (e.g., "SBIN.NS", "ITC.BO").'),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').describe('The start date of the range in YYYY-MM-DD format (inclusive).'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').describe('The end date of the range in YYYY-MM-DD format (inclusive).'),
    }),
  },
  getCompanyQuoteSummary: {
    inputSchema: z.object({
      symbol: z.string().min(1).describe("The exact Indian stock symbol (e.g., 'RELIANCE.NS', 'TCS.NS')."),
      modules: z.array(
        z.enum([
          'balanceSheetHistory',
          'balanceSheetHistoryQuarterly',
          'calendarEvents',
          'cashflowStatementHistory',
          'cashflowStatementHistoryQuarterly',
          'defaultKeyStatistics',
          'details',
          'earnings',
          'esgScores',
          'incomeStatementHistory',
          'incomeStatementHistoryQuarterly',
          'summaryProfile',
        ]),
      ).min(1).describe('An array of data modules to retrieve (e.g., ["defaultKeyStatistics", "summaryProfile"]).'),
    }),
  },
  getUpcomingIpos: {
    inputSchema: z.object({}), // No input
  },
  analyzeFinancialHealth: {
    inputSchema: z.object({}), // No input needed from the user
  },
  createSavingGoal: {
    inputSchema: z.object({
      goalName: z.string().min(1).describe('Name of the goal (e.g., \'Vacation Fund\'). Example: "New Car Fund"'),
      targetAmount: z.number().positive('Target amount to save. Example: 15000'),
      targetDateDescription: z.string().optional().describe('Optional target date (e.g., \'end of year\', \'2025-12-31\'). Example: "next year" or "2026-06-30"'),
    }),
  },
  findSavingGoal: {
    inputSchema: z.object({
      goalIdentifier: z.string().min(1).describe('Name or part of the name of the goal. Example: "Vacation" or "goal_abc123"'),
    }),
  },
  executeConfirmedUpdateGoal: {
    inputSchema: z.object({
      goalId: z.string().describe('Exact unique ID of the goal. Example: "goal_def456"'),
      newTargetAmount: z.number().positive().optional().describe('New target amount (optional). Example: 20000'),
      newTargetDateDescription: z.string().optional().describe("New target date (e.g., '2026-01-01', 'end of next year') (optional). Use 'null' or empty string to remove date. Example: \"2027-12-31\" or \"null\""),
    }),
  },
  executeAddAmountToGoalById: {
    inputSchema: z.object({
      goalId: z.string().describe('The exact unique ID of the saving goal. Example: "goal_ghi789"'),
      amountToAdd: z.number().positive('The amount to add. Example: 500'),
    }),
  },
  executeWithdrawAmountFromGoalById: {
    inputSchema: z.object({
      goalId: z.string().describe('The exact unique ID of the saving goal. Example: "goal_jkl012"'),
      amountToWithdraw: z.number().positive('The amount to withdraw. Example: 100'),
    }),
  },
  executeConfirmedDeleteGoal: {
    inputSchema: z.object({
      goalId: z.string().describe('The exact unique ID of the goal to delete. Example: "goal_mno345"'),
    }),
  },
  createInvestmentAccount: {
    inputSchema: z.object({
      accountName: z
        .string()
        .min(1)
        .describe(
          "A descriptive name for the account (e.g., 'Zerodha Stocks', 'Groww Mutual Funds').",
        ),
      platform: z
        .string()
        .optional()
        .describe("The name of the broker or platform (e.g., 'Zerodha', 'Vanguard')."),
      currency: z
        .string()
        .length(3)
        .describe('The 3-letter currency code for this account (e.g., INR, USD).'),
    }),
  },
  identifyInvestmentAccountForAction: {
    inputSchema: z.object({
      accountIdentifier: z
        .string()
        .min(1)
        .describe(
          'Name or ID of the investment account. Example: "My Brokerage" or "inv_acc_123"',
        ),
    }),
  },
  executeConfirmedUpdateInvestmentAccount: {
    inputSchema: z.object({
      accountId: z
        .string()
        .describe('The exact unique ID of the investment account, from user confirmation.'),
      newName: z.string().min(1).optional().describe('Optional: The new name for the account.'),
      newPlatform: z
        .string()
        .min(1)
        .optional()
        .describe('Optional: The new platform/broker name.'),
    }),
  },
  executeConfirmedDeleteInvestmentAccount: {
    inputSchema: z.object({
      accountId: z
        .string()
        .describe('Exact unique ID of the investment account to delete. Example: "inv_acc_789"'),
    }),
  },
};

export type MyToolTypes = InferUITools<typeof tools>;
