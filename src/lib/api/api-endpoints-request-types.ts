import { z } from 'zod';

// =================================================================
// Reusable Base Schemas
// =================================================================

const idParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format.' })
});

const accountIdParamSchema = z.object({
  accountId: z.string().uuid({ message: 'Invalid Account ID format.' })
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// =================================================================
// Specific Schemas
// =================================================================

const historicalPortfolioQuerySchema = z
  .object({
    period: z.enum(['7d', '30d', '90d', '1y']).optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    symbol: z.string().optional()
  })
  .refine((data) => !(data.startDate && !data.endDate) && !(!data.startDate && data.endDate), {
    message: 'Both startDate and endDate must be provided together.',
    path: ['startDate', 'endDate']
  });

const aiPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  sessionId: z.string().optional(),
  base64Image: z.string().optional(),
  documentContent: z.string().optional(),
  documentType: z.enum(['pdf', 'xlsx']).optional(),
  documentName: z.string().optional()
});

const pdfProcessSchema = z.object({
  documentContent: z.string().min(50, 'Document content is too short to be a valid statement.')
});

// =================================================================
// Endpoint Definitions
// =================================================================

export const apiEndpoints = {
  accounts: {
    getDashboard: {
      method: 'GET',
      path: '/accounts/dashboard'
    },
    searchTerm: {
      method: 'GET',
      path: '/accounts/searchTerm',
      query: z.object({
        q: z.string().min(1, 'Search query is required.')
      })
    },
    getUsersForDropdown: {
      method: 'GET',
      path: '/accounts/dropdown/user',
      query: z.object({
        q: z.string().optional()
      })
    },
    shareAccount: {
      method: 'POST',
      path: '/accounts/share',
      body: z.object({
        accountId: z.string().uuid(),
        userId: z.string()
      })
    },
    importTransactions: {
      method: 'POST',
      path: '/accounts/import/transaction',
      body: z.object({
        accountId: z.string().uuid(),
        document: z.any().refine((file) => file && file.size > 0, 'Document file is required.')
      })
    },
    getSampleImportFile: {
      method: 'GET',
      path: '/accounts/sampleFile/import'
    },
    getSharedAccounts: {
      method: 'GET',
      path: '/accounts/get-shares',
      query: paginationQuerySchema.extend({
        search: z.string().optional()
      })
    },
    getPreviousShares: {
      method: 'GET',
      path: '/accounts/previous/share/:id',
      params: idParamSchema
    },
    confirmImport: {
      method: 'POST',
      path: '/accounts/confirm/import/:id',
      params: idParamSchema
    },
    getCustomAnalytics: {
      method: 'GET',
      path: '/accounts/customAnalytics/:id',
      params: idParamSchema,
      query: z.object({
        duration: z.string().min(1, 'Duration query parameter is required.')
      })
    },
    getImportData: {
      method: 'GET',
      path: '/accounts/get/import/:id',
      params: idParamSchema
    },
    getAll: {
      method: 'GET',
      path: '/accounts',
      query: paginationQuerySchema.extend({
        search: z.string().optional()
      })
    },
    getList: {
      method: 'GET',
      path: '/accounts/list'
    },
    create: {
      method: 'POST',
      path: '/accounts',
      body: z.object({
        name: z.string().min(1, 'Account name is required.').max(64).trim(),
        balance: z.number().min(0),
        currency: z.string().length(3, 'Currency must be 3 characters long.')
      })
    },
    revokeShare: {
      method: 'POST',
      path: '/accounts/revoke-share',
      body: z.object({
        accountId: z.string().uuid(),
        userId: z.string()
      })
    },
    getById: {
      method: 'GET',
      path: '/accounts/:id',
      params: idParamSchema
    },
    update: {
      method: 'PUT',
      path: '/accounts/:id',
      params: idParamSchema,
      body: z.object({
        name: z.string().min(1).max(64).trim().optional(),
        isDefault: z.boolean().optional()
      })
    },
    delete: {
      method: 'DELETE',
      path: '/accounts/:id',
      params: idParamSchema
    },
    getStatement: {
      method: 'GET',
      path: '/accounts/:id/statement',
      params: idParamSchema,
      query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        numTransactions: z.string().optional(),
        exportType: z.enum(['pdf', 'xlsx'])
      })
    }
  },
  transactions: {
    export: {
      method: 'GET',
      path: '/transactions/export',
      query: z.object({
        accountId: z.string().uuid().optional(),
        duration: z.string().optional(),
        q: z.string().optional(),
        isIncome: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        format: z.enum(['xlsx', 'csv']).default('xlsx'),
        minAmount: z.coerce.number().optional(),
        maxAmount: z.coerce.number().optional()
      })
    },
    bulkCreate: {
      method: 'POST',
      path: '/transactions/bulk-create',
      body: z.object({
        transactions: z.array(
          z.object({
            text: z.string().min(1),
            amount: z.number().positive(),
            isIncome: z.boolean(),
            categoryName: z.string().optional(),
            transfer: z.string().optional(),
            createdAt: z.string().datetime(),
            accountId: z.string().uuid()
          })
        )
      })
    },
    getAll: {
      method: 'GET',
      path: '/transactions',
      query: paginationQuerySchema.extend({
        accountId: z.string().uuid().optional(),
        duration: z.string().optional(),
        q: z.string().optional(),
        isIncome: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        minAmount: z.coerce.number().optional(),
        maxAmount: z.coerce.number().optional(),
        type: z.string().optional()
      })
    },
    getById: {
      method: 'GET',
      path: '/transactions/:id',
      params: idParamSchema
    },
    create: {
      method: 'POST',
      path: '/transactions',
      body: z.object({
        text: z.string().min(1).max(255).trim(),
        amount: z.coerce.number(),
        isIncome: z.boolean(),
        transfer: z.string().optional(),
        category: z.string().uuid().optional().nullable(),
        account: z.string().uuid(),
        recurring: z.boolean().optional(),
        recurrenceType: z
          .enum(['daily', 'weekly', 'monthly', 'yearly', 'hourly'])
          .optional()
          .nullable(),
        recurrenceEndDate: z.string().datetime().optional().nullable(),
        currency: z.string().optional(),
        createdAt: z.string().datetime().optional().nullable()
      })
    },
    update: {
      method: 'PUT',
      path: '/transactions/:id',
      params: idParamSchema,
      body: z
        .object({
          text: z.string().min(1).max(255).trim().optional(),
          amount: z.coerce.number().optional(),
          isIncome: z.boolean().optional(),
          transfer: z.string().optional(),
          category: z.string().uuid().optional().nullable(),
          account: z.string().uuid().optional(),
          recurring: z.boolean().optional(),
          recurrenceType: z
            .enum(['daily', 'weekly', 'monthly', 'yearly', 'hourly'])
            .optional()
            .nullable(),
          recurrenceEndDate: z.string().datetime().optional().nullable(),
          currency: z.string().optional(),
          createdAt: z.string().datetime().optional().nullable()
        })
        .partial()
    },
    delete: {
      method: 'DELETE',
      path: '/transactions/:id',
      params: idParamSchema
    },
    getCategoryChart: {
      method: 'GET',
      path: '/transactions/by/category/chart',
      query: z.object({
        duration: z.string().optional(),
        accountId: z.string().uuid().optional()
      })
    },
    getIncomeExpenseTotals: {
      method: 'GET',
      path: '/transactions/by/income/expense',
      query: z.object({
        duration: z.string().optional(),
        accountId: z.string().uuid().optional()
      })
    },
    getIncomeExpenseChart: {
      method: 'GET',
      path: '/transactions/by/income/expense/chart',
      query: z.object({
        duration: z.string().optional(),
        accountId: z.string().uuid().optional()
      })
    },
    getFakeData: {
      method: 'GET',
      path: '/transactions/fakeData/by',
      query: z.object({
        duration: z.string().optional(),
        length: z.coerce.number().int().positive().max(1000).optional()
      })
    }
  },
  user: {
    getMe: {
      method: 'GET',
      path: '/auth/me'
    },
    update: {
      method: 'PUT',
      path: '/auth/update'
      // No body schema here, as it's FormData and can't be validated by Zod on the client.
    },
    updatePreferences: {
      method: 'PUT',
      path: '/auth/preferences',
      body: z.object({
        preferredCurrency: z.string().length(3)
      })
    },
    getPreferences: {
      method: 'GET',
      path: '/auth/preferences'
    }
  },
  settings: {
    get: {
      method: 'GET',
      path: '/settings'
    },
    update: {
      method: 'PUT',
      path: '/settings',
      body: z
        .object({
          theme: z.enum(['light', 'dark', 'system']).optional(),
          notifications: z
            .object({
              enableAll: z.boolean().optional(),
              budgetAlerts: z.boolean().optional(),
              goalReminders: z.boolean().optional(),
              billReminders: z.boolean().optional()
            })
            .partial()
            .optional()
        })
        .partial()
    },
    updateAiKey: {
      method: 'PUT',
      path: '/settings/ai-key',
      body: z.object({
        apiKey: z.string().nullable()
      })
    }
  },
  category: {
    getAll: {
      method: 'GET',
      path: '/category',
      query: paginationQuerySchema.extend({
        search: z.string().optional()
      })
    },
    getById: {
      method: 'GET',
      path: '/category/:id',
      params: idParamSchema
    },
    create: {
      method: 'POST',
      path: '/category',
      body: z.object({
        name: z.string().min(1).max(64).trim()
      })
    },
    delete: {
      method: 'DELETE',
      path: '/category/:id',
      params: idParamSchema
    },
    update: {
      method: 'PUT',
      path: '/category/:id',
      params: idParamSchema,
      body: z.object({
        name: z.string().min(1).max(64).trim()
      })
    }
  },
  budget: {
    getAll: {
      method: 'GET',
      path: '/budget/all',
      query: paginationQuerySchema.extend({
        q: z.string().optional()
      })
    },
    create: {
      method: 'POST',
      path: '/budget',
      body: z.object({
        category: z.string().uuid(),
        month: z.coerce.number().int().min(1).max(12),
        year: z.coerce.number().int(),
        amount: z.coerce.number().positive()
      })
    },
    update: {
      method: 'PUT',
      path: '/budget/:id',
      params: idParamSchema,
      body: z.object({
        amount: z.coerce.number().positive()
      })
    },
    delete: {
      method: 'DELETE',
      path: '/budget/:id',
      params: idParamSchema
    },
    getSummary: {
      method: 'GET',
      path: '/budget/summary',
      query: z.object({
        duration: z.string().optional(),
        month: z.string().optional(),
        year: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      })
    },
    getProgress: {
      method: 'GET',
      path: '/budget/:id/progress',
      params: idParamSchema
    }
  },
  goal: {
    getAll: {
      method: 'GET',
      path: '/goal/all',
      query: paginationQuerySchema.extend({
        q: z.string().optional()
      })
    },
    create: {
      method: 'POST',
      path: '/goal',
      body: z.object({
        name: z.string().min(1),
        targetAmount: z.coerce.number().positive(),
        targetDate: z.string().datetime().optional().nullable()
      })
    },
    update: {
      method: 'PUT',
      path: '/goal/:id',
      params: idParamSchema,
      body: z.object({
        name: z.string().min(1).optional(),
        targetAmount: z.coerce.number().positive().optional(),
        savedAmount: z.coerce.number().nonnegative().optional(),
        targetDate: z.date().optional().nullable()
      })
    },
    addAmount: {
      method: 'PUT',
      path: '/goal/:id/add-amount',
      params: idParamSchema,
      body: z.object({
        amount: z.coerce.number().positive()
      })
    },
    withdrawAmount: {
      method: 'PUT',
      path: '/goal/:id/withdraw-amount',
      params: idParamSchema,
      body: z.object({
        amount: z.coerce.number().positive()
      })
    },
    delete: {
      method: 'DELETE',
      path: '/goal/:id',
      params: idParamSchema
    }
  },
  interest: {
    calculate: {
      method: 'POST',
      path: '/interest/calculate',
      body: z.object({
        amount: z.number().positive(),
        interestRate: z.number().min(0),
        termLength: z.number().int().positive(),
        termUnit: z.enum(['days', 'weeks', 'months', 'years']),
        interestType: z.enum(['simple', 'compound']),
        compoundingFrequency: z.number().int().positive().optional()
      })
    },
    getDebtSchedule: {
      method: 'GET',
      path: '/interest/debts/:id/schedule',
      params: idParamSchema
    },
    createDebt: {
      method: 'POST',
      path: '/interest/debts',
      body: z.object({
        amount: z.number().positive('Amount must be positive.'),
        description: z.string().max(255).optional(),
        interestRate: z.number().min(0).default(0),
        interestType: z.enum(['simple', 'compound']),
        startDate: z.union([z.date(), z.string()]).optional(),
        termLength: z.number().int().positive('Term length must be a positive integer.'),
        termUnit: z.enum(['days', 'weeks', 'months', 'years']),
        paymentFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
        type: z.enum(['given', 'taken']),
        user: z.string(),
        account: z.string()
      })
    },
    getDebts: {
      method: 'GET',
      path: '/interest/debts',
      query: paginationQuerySchema.extend({
        duration: z.string().optional(),
        q: z.string().optional(),
        type: z.enum(['given', 'taken']).optional(),
        isPaid: z.enum(['true', 'false']).optional()
      })
    },
    updateDebt: {
      method: 'PUT',
      path: '/interest/debts/:id',
      params: idParamSchema,
      body: z.object({
        description: z.string().max(255).optional(),
        interestRate: z.number().min(0).optional(),
        termLength: z.number().int().positive().optional(),
        termUnit: z.enum(['days', 'weeks', 'months', 'years']).optional()
      })
    },
    deleteDebt: {
      method: 'DELETE',
      path: '/interest/debts/:id',
      params: idParamSchema
    },
    markDebtAsPaid: {
      method: 'PUT',
      path: '/interest/debts/:id/mark-paid',
      params: idParamSchema
    }
  },
  investmentAccount: {
    getAll: {
      method: 'GET',
      path: '/investmentAccount/all',
      query: paginationQuerySchema
    },
    getSummary: {
      method: 'GET',
      path: '/investmentAccount/:id/summary',
      params: idParamSchema
    },
    getById: {
      method: 'GET',
      path: '/investmentAccount/:id',
      params: idParamSchema
    },
    create: {
      method: 'POST',
      path: '/investmentAccount',
      body: z.object({
        name: z.string().min(1),
        platform: z.string().optional(),
        currency: z.string().length(3)
      })
    },
    update: {
      method: 'PUT',
      path: '/investmentAccount/:id',
      params: idParamSchema,
      body: z.object({
        name: z.string().min(1).optional(),
        platform: z.string().optional()
      })
    },
    delete: {
      method: 'DELETE',
      path: '/investmentAccount/:id',
      params: idParamSchema
    },
    getPerformance: {
      method: 'GET',
      path: '/investmentAccount/:id/performance',
      params: idParamSchema,
      query: historicalPortfolioQuerySchema
    }
  },
  investment: {
    getOldestDate: {
      method: 'GET',
      path: '/investment/oldest-date'
    },
    getPortfolioSummary: {
      method: 'GET',
      path: '/investment/portfolio-summary'
    },
    searchStocks: {
      method: 'GET',
      path: '/investment/stocks/search',
      query: z.object({ q: z.string().min(1) })
    },
    getStockPrice: {
      method: 'GET',
      path: '/investment/stocks/price/:symbol',
      params: z.object({ symbol: z.string().min(1) })
    },
    getHistoricalStockPrice: {
      method: 'GET',
      path: '/investment/stocks/historical-price/:symbol',
      params: z.object({ symbol: z.string().min(1) }),
      query: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
      })
    },
    getHistoricalPortfolio: {
      method: 'GET',
      path: '/investment/portfolio-historical',
      query: historicalPortfolioQuerySchema
    },
    getPerformance: {
      method: 'GET',
      path: '/investment/details/:id/performance',
      params: idParamSchema
    },
    getDetails: {
      method: 'GET',
      path: '/investment/details/:id',
      params: idParamSchema
    },
    updateDividend: {
      method: 'PUT',
      path: '/investment/:id/update-dividend',
      params: idParamSchema,
      body: z.object({ dividend: z.coerce.number().nonnegative() })
    },
    getAllForAccount: {
      method: 'GET',
      path: '/investment/:accountId',
      params: accountIdParamSchema,
      query: paginationQuerySchema.extend({
        q: z.string().optional()
      })
    },
    update: {
      method: 'PUT',
      path: '/investment/:id',
      params: idParamSchema,
      body: z.object({
        shares: z.coerce.number().positive().optional(),
        purchasePrice: z.coerce.number().nonnegative().optional(),
        purchaseDate: z.string().datetime().optional()
      })
    },
    delete: {
      method: 'DELETE',
      path: '/investment/:id',
      params: idParamSchema
    },
    create: {
      method: 'POST',
      path: '/investment',
      body: z.object({
        account: z.string().uuid(),
        symbol: z.string().min(1),
        shares: z.coerce.number().positive(),
        purchasePrice: z.coerce.number().nonnegative(),
        purchaseDate: z.string().datetime()
      })
    }
  },
  ai: {
    process: {
      method: 'POST',
      path: '/ai/process',
      body: aiPromptSchema
    },
    processPdf: {
      method: 'POST',
      path: '/ai/process-pdf',
      body: pdfProcessSchema
    },
    getFinancialHealth: {
      method: 'GET',
      path: '/ai/financial-health/analysis'
    }
  },
  invitation: {
    create: {
      method: 'POST',
      path: '/invite',
      body: z.object({
        email: z.string().email()
      })
    },
    verify: {
      method: 'GET',
      path: '/invite/verify',
      query: z.object({
        token: z.string().min(1)
      })
    }
  },
  currency: {
    getSupported: {
      method: 'GET',
      path: '/currency/supported'
    },
    convert: {
      method: 'GET',
      path: '/currency/convert',
      query: z.object({
        amount: z.coerce.number().positive(),
        from: z.string().length(3),
        to: z.string().length(3)
      })
    }
  }
} as const;
