import { z } from 'zod';

export const tools = {
  // Account Tools
  createAccount: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Account'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  identifyAccountForAction: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        type: z.literal('data-clarificationOptions'),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedDeleteAccount: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  executeConfirmedUpdateAccountName: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Account'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },

  // Budget Tools
  createBudget: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Budget'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  identifyBudgetForAction: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        clarificationNeeded: z.literal(true),
        message: z.string(),
        options: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedUpdateBudget: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Budget'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeConfirmedDeleteBudget: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },

  // Category Tools
  createCategory: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Category'),
        name: z.string(),
        id: z.string()
      })
    })
  },
  identifyCategoryForAction: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        type: z.literal('data-clarificationOptions'),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedDeleteCategory: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  executeConfirmedUpdateCategoryName: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Category'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },

  // Debt Tools
  addDebt: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Debt'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  markDebtAsPaid: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        type: z.literal('data-clarificationOptions'),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedMarkDebtPaid: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  identifyDebtForAction: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        type: z.literal('data-clarificationOptions'),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedUpdateDebt: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Debt'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeConfirmedDeleteDebt: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },

  // External Tools
  parseNaturalLanguageDateRange: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        message: z.string(),
        data: z.object({
          startDate: z.string(),
          endDate: z.string()
        })
      })
    ])
  },
  searchStockSymbols: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-stockSearchResults'),
      data: z.array(
        z.object({
          symbol: z.string(),
          name: z.string(),
          exchange: z.string(),
          type: z.string()
        })
      )
    })
  },
  getCurrentStockPrice: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
        price: z.number(),
        change: z.number().nullable(),
        changePercent: z.number().nullable(),
        exchange: z.string(),
        currency: z.string(),
        companyName: z.string(),
        marketState: z.string(),
        regularMarketTime: z.string().nullable()
      })
    })
  },
  getHistoricalStockPriceOnDate: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string(),
        data: z.array(z.any()).optional()
      }),
      z.object({
        success: z.literal(true),
        message: z.string(),
        data: z.object({
          symbol: z.string(),
          date: z.string(),
          price: z.number().nullable(),
          currency: z.string(),
          exchange: z.string(),
          companyName: z.string()
        })
      })
    ])
  },
  getHistoricalStockPriceRange: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        message: z.string(),
        data: z.array(
          z.object({
            date: z.string(),
            price: z.number().nullable()
          })
        )
      })
    ])
  },
  getCompanyQuoteSummary: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.any().nullable()
    })
  },
  getUpcomingIpos: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-ipoLink'),
      data: z.string()
    })
  },
  convertCurrency: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        convertedAmount: z.number(),
        fromCurrency: z.string(),
        toCurrency: z.string(),
        rate: z.number()
      })
    })
  },

  // Financial Health Tools
  analyzeFinancialHealth: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        score: z.number(),
        highlights: z.array(z.object({ emoji: z.string(), statement: z.string() })),
        improvements: z.array(z.object({ emoji: z.string(), statement: z.string() })),
        recommendations: z.array(z.object({ title: z.string(), description: z.string() }))
      })
    })
  },

  // Help Tools
  getHelpArticle: {
    outputSchema: z.object({
      article: z.string()
    })
  },

  // Image Tools
  analyzeFinancialImage: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.array(
        z.object({
          date: z.string(),
          description: z.string(),
          category: z.string(),
          debit: z.number().optional(),
          credit: z.number().optional()
        })
      )
    })
  },

  // Goal Tools
  createSavingGoal: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Goal'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  findSavingGoal: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        type: z.literal('data-clarificationOptions'),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedUpdateGoal: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Goal'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeAddAmountToGoalById: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Goal'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeWithdrawAmountFromGoalById: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Goal'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeConfirmedDeleteGoal: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },

  // Investment Account Tools
  createInvestmentAccount: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Investment Account'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  identifyInvestmentAccountForAction: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        type: z.literal('data-clarificationOptions'),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedUpdateInvestmentAccount: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Investment Account'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeConfirmedDeleteInvestmentAccount: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },

  // Investment Tools
  addInvestmentWithInferredPrice: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Investment'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  addInvestment: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Investment'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  identifyInvestmentForAction: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        type: z.literal('data-clarificationOptions'),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedUpdateInvestment: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Investment'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeConfirmedUpdateDividend: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Investment'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeConfirmedDeleteInvestment: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },

  // Subscription Tools
  findRecurringTransactions: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        subscriptions: z.array(
          z.object({
            merchant: z.string(),
            frequency: z.union([z.literal('monthly'), z.literal('yearly'), z.literal('unknown')]),
            averageAmount: z.number(),
            transactionCount: z.number(),
            lastPaymentDate: z.any() // Date object, but can be string in JSON
          })
        )
      })
    })
  },

  // Transaction Tools
  addTransaction: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Transaction'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  identifyTransactionForAction: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        type: z.literal('data-clarificationOptions'),
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            currency: z.string().optional(),
            details: z.string().optional(),
            balance: z.number().optional()
          })
        )
      }),
      z.object({
        success: z.literal(true),
        confirmationNeeded: z.literal(true),
        id: z.string(),
        details: z.string(),
        message: z.string()
      })
    ])
  },
  executeConfirmedUpdateTransaction: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      type: z.literal('data-createdEntitySummary'),
      data: z.object({
        type: z.literal('Transaction'),
        name: z.string(),
        id: z.string(),
        details: z.string()
      })
    })
  },
  executeConfirmedDeleteTransaction: {
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  getExpenseBreakdown: {
    outputSchema: z.union([
      z.object({
        success: z.literal(false),
        error: z.string()
      }),
      z.object({
        success: z.literal(true),
        message: z.string(),
        data: z.array(
          z.object({
            category: z.string(),
            amount: z.number(),
            percentage: z.number()
          })
        )
      })
    ])
  },

  // Visualization Tools
  generateChartData: {
    outputSchema: z.object({
      success: z.boolean(),
      data: z.object({
        type: z.union([z.literal('auto'), z.literal('bar'), z.literal('line'), z.literal('pie')]),
        data: z.array(z.record(z.string(), z.any())) // Array of objects with arbitrary keys/values
      })
    })
  },
  fetchDataRecords: {
    outputSchema: z.object({
      success: z.boolean(),
      data: z.object({
        records: z.array(z.record(z.string(), z.any())), // Array of objects with arbitrary keys/values
        count: z.number()
      })
    })
  },
  calculateMetrics: {
    outputSchema: z.object({
      success: z.boolean(),
      data: z.object({
        metrics: z.record(z.string(), z.any()) // Object with arbitrary keys/values
      })
    })
  }
};

export type MyToolTypes = {
  [K in keyof typeof tools]: {
    input: unknown; // Frontend doesn't care about input, so use unknown
    output: z.infer<(typeof tools)[K]['outputSchema']>;
  };
};
