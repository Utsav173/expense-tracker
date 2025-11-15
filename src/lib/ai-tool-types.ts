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

const financialHealthAnalysisSchema = z.object({
  score: z.number(),
  highlights: z.array(z.object({ emoji: z.string(), statement: z.string() })),
  improvements: z.array(z.object({ emoji: z.string(), statement: z.string() })),
  recommendations: z.array(z.object({ title: z.string(), description: z.string() }))
});

const subscriptionAnalysisSchema = z.object({
  subscriptions: z.array(
    z.object({
      merchant: z.string(),
      frequency: z.string(),
      averageAmount: z.number(),
      transactionCount: z.number(),
      lastPaymentDate: z.string()
    })
  )
});

const tools = {
  // Account Tools
  createAccount: {
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
  identifyCategoryForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteCategory: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateCategoryName: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Transaction Tools
  addTransaction: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: transactionSchema.optional() })
  },
  identifyTransactionForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateTransaction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteTransaction: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Budget Tools
  createBudget: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: budgetSchema.optional() })
  },
  identifyBudgetForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateBudget: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteBudget: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Goal Tools
  createSavingGoal: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: goalSchema.optional() })
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
  identifyInvestmentForAction: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateInvestment: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedUpdateDividend: { inputSchema: z.any(), outputSchema: toolOutputSchema },
  executeConfirmedDeleteInvestment: { inputSchema: z.any(), outputSchema: toolOutputSchema },

  // Debt Tools
  addDebt: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({ data: debtSchema.optional() })
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
          metrics: z.record(z.string(), z.any())
        })
        .optional()
    })
  },

  // Advanced Analysis Tool
  analyzeFinancialHealth: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({
      data: financialHealthAnalysisSchema.optional()
    })
  },
  findRecurringTransactions: {
    inputSchema: z.any(),
    outputSchema: toolOutputSchema.extend({
      data: subscriptionAnalysisSchema.optional()
    })
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
