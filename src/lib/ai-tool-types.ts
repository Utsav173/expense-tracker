// src/lib/ai-tool-types.ts

import { z } from 'zod';
import { InferUITools } from 'ai';
import type {
  AccountAPI,
  CategoryAPI,
  TransactionAPI,
  BudgetAPI,
  GoalAPI,
  InvestmentAccountAPI,
  InvestmentAPI,
  DebtAndInterestAPI
} from '@/lib/api/api-types';

// Base schema for all tool outputs to ensure consistency
const toolOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  clarificationNeeded: z.boolean().optional(),
  confirmationNeeded: z.boolean().optional(),
  options: z.array(z.any()).optional(),
  id: z.string().optional(),
  details: z.string().optional()
});

// Reusable schemas based on existing API types for consistency
const transactionSchema = z.custom<TransactionAPI.Transaction>();
const accountSchema = z.custom<AccountAPI.Account>();
const categorySchema = z.custom<CategoryAPI.Category>();
const budgetSchema = z.custom<BudgetAPI.Budget>();
const goalSchema = z.custom<GoalAPI.SavingGoal>();
const investmentAccountSchema = z.custom<InvestmentAccountAPI.InvestmentAccount>();
const investmentSchema = z.custom<InvestmentAPI.Investment>();
const debtSchema = z.custom<DebtAndInterestAPI.Debt>();
const stockSearchResultSchema = z.custom<InvestmentAPI.StockSearchResult>();
const stockPriceResultSchema = z.custom<InvestmentAPI.StockPriceResult>();
const historicalPriceResultSchema = z.custom<InvestmentAPI.HistoricalPriceResult>();
const currencyConversionResultSchema = z.object({
  convertedAmount: z.number(),
  rate: z.number()
});
const financialSummarySchema = z.any(); // Define more strictly if needed

const tools = {
  // Account Tools
  createAccount: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: accountSchema.optional() })
  },
  listAccounts: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(accountSchema).optional() })
  },
  getAccountBalance: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: accountSchema.optional() })
  },
  identifyAccountForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteAccount: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateAccountName: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Category Tools
  createCategory: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: categorySchema.optional() })
  },
  listCategories: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(categorySchema).optional() })
  },
  identifyCategoryForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteCategory: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateCategoryName: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Transaction Tools
  addTransaction: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: transactionSchema.optional() })
  },
  listTransactions: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(transactionSchema).optional() })
  },
  identifyTransactionForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateTransaction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteTransaction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  getExtremeTransaction: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: transactionSchema.nullable().optional() })
  },

  // Budget Tools
  createBudget: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: budgetSchema.optional() })
  },
  listBudgets: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(budgetSchema).optional() })
  },
  getBudgetProgress: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.any().optional() })
  },
  getBudgetSummary: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({
      data: z.array(z.any()).optional(),
      chart: z.any().optional()
    })
  },
  identifyBudgetForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateBudget: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteBudget: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Goal Tools
  createSavingGoal: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: goalSchema.optional() })
  },
  listSavingGoals: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(goalSchema).optional() })
  },
  findSavingGoal: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateGoal: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeAddAmountToGoalById: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeWithdrawAmountFromGoalById: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteGoal: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Investment Account Tools
  createInvestmentAccount: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: investmentAccountSchema.optional() })
  },
  listInvestmentAccounts: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(investmentAccountSchema).optional() })
  },
  identifyInvestmentAccountForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateInvestmentAccount: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteInvestmentAccount: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Investment Tools
  addInvestment: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: investmentSchema.optional() })
  },
  addInvestmentWithInferredPrice: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: investmentSchema.optional() })
  },
  listInvestments: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(investmentSchema).optional() })
  },
  identifyInvestmentForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateInvestment: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateDividend: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteInvestment: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Debt Tools
  addDebt: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: debtSchema.optional() })
  },
  listDebts: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(debtSchema).optional() })
  },
  markDebtAsPaid: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedMarkDebtPaid: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  identifyDebtForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateDebt: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteDebt: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Visualization Tools
  generateChartData: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({
      data: z
        .object({
          type: z.enum(['auto', 'bar', 'line', 'pie']),
          data: z.array(z.any())
        })
        .optional()
    })
  },
  fetchDataRecords: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({
      data: z
        .object({
          records: z.array(z.any()),
          count: z.number()
        })
        .optional()
    })
  },
  calculateMetrics: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({
      data: z
        .object({
          metrics: z.record(z.any())
        })
        .optional()
    })
  },

  // Summary Tool
  generateFinancialSummary: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: financialSummarySchema.optional() })
  },

  // Image Tool
  analyzeFinancialImage: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(z.any()).optional() })
  },

  // External Tools
  parseNaturalLanguageDateRange: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({
      data: z.object({ startDate: z.string(), endDate: z.string() }).optional()
    })
  },
  searchStockSymbols: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(stockSearchResultSchema).optional() })
  },
  getCurrentStockPrice: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: stockPriceResultSchema.optional() })
  },
  getHistoricalStockPriceOnDate: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: historicalPriceResultSchema.optional() })
  },
  getHistoricalStockPriceRange: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.array(historicalPriceResultSchema).optional() })
  },
  getCompanyQuoteSummary: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.any().optional() })
  },
  getUpcomingIpos: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: z.string().optional() })
  },
  convertCurrency: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: currencyConversionResultSchema.optional() })
  }
};

export type MyToolTypes = InferUITools<typeof tools>;
