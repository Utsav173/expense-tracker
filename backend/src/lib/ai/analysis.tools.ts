import { tool } from 'ai';
import { z } from 'zod';
import { transactionService } from '../../services/transaction.service';
import { accountService } from '../../services/account.service';
import { HTTPException } from 'hono/http-exception';
import { formatCurrency } from '../../utils/currency.utils';
import { createToolResponse, resolveAccountId } from './shared';
import { parseNaturalLanguageDateRange } from '../../utils/nl_date.utils';

export function createAnalysisTools(userId: string) {
  return {
    getSpendingByCategory: tool({
      description:
        'Retrieves a summary of spending by category for a specified date range and optional account.',
      parameters: z.object({
        dateDescription: z
          .string()
          .optional()
          .describe(
            "Date range (e.g., 'this month', 'last quarter', '2023-07,2023-09'). Defaults to this month. Example: \"last month\" or \"this year\"",
          ),
        accountIdentifier: z
          .string()
          .optional()
          .describe('Optional: Filter by account name or ID. Example: "Cash Account" or "acc_123"'),
      }),
      execute: async ({ dateDescription, accountIdentifier }) => {
        try {
          let accountId: string | undefined = undefined;
          if (accountIdentifier) {
            const accountRes = await resolveAccountId(userId, accountIdentifier);
            if ('error' in accountRes)
              return createToolResponse({ success: false, error: accountRes.error });
            if ('clarificationNeeded' in accountRes)
              return createToolResponse({
                success: true,
                clarificationNeeded: true,
                message: 'Which account?',
                options: accountRes.options,
              });
            accountId = accountRes.id;
          }

          const updatedDateRange = parseNaturalLanguageDateRange(dateDescription);

          const result = await transactionService.getCategoryChartData(
            userId,
            accountId,
            `${updatedDateRange?.startDate.toISOString()},${updatedDateRange?.endDate.toISOString()}`,
          );

          const typedResult = result as {
            name: string[];
            totalIncome: number[];
            totalExpense: number[];
          };

          if (!typedResult || !typedResult.name || typedResult.name.length === 0) {
            const period = dateDescription || 'this month';
            return createToolResponse({
              success: true,
              message: `No spending data found for ${period}${
                accountId ? ` in account "${accountIdentifier}"` : ''
              }.`,
            });
          }

          const spendingSummary = typedResult.name.map((name: string, index: number) => ({
            category: name,
            totalExpense: typedResult.totalExpense[index] || 0,
          }));

          spendingSummary.sort(
            (a: { totalExpense: number }, b: { totalExpense: number }) =>
              b.totalExpense - a.totalExpense,
          );

          const totalOverallExpense = spendingSummary.reduce(
            (sum: number, item: { totalExpense: number }) => sum + item.totalExpense,
            0,
          );

          let message = `Your spending breakdown${
            accountId ? ` in account "${accountIdentifier}"` : ''
          }${dateDescription ? ` for ${dateDescription}` : ' for this month'}:`;
          if (spendingSummary.length > 0) {
            message += ` Top categories:`;
            spendingSummary
              .slice(0, 3)
              .forEach((item: { category: string; totalExpense: number }, index: number) => {
                message += ` ${item.category} (${formatCurrency(item.totalExpense, 'INR')})`;
                if (index < Math.min(spendingSummary.length, 3) - 1) message += ',';
                else message += '.';
              });
            if (spendingSummary.length > 3) {
              message += ` Total expenses: ${formatCurrency(totalOverallExpense, 'INR')}.`;
            }
          } else {
            message += ` No spending recorded.`;
          }

          const chartData = typedResult.name
            .map((name, index) => ({
              name,
              value: typedResult.totalExpense[index] || 0,
            }))
            .filter((item) => item.value > 0);

          return createToolResponse({
            success: true,
            message: message,
            data: typedResult,
            chart:
              chartData.length > 0
                ? {
                    type: 'pie',
                    data: chartData,
                    title: `Spending by Category for ${dateDescription || 'this month'}`,
                  }
                : undefined,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getIncomeExpenseTrends: tool({
      description:
        'Retrieves time-series data for income, expense, and balance trends over a specified date range and optional account.',
      parameters: z.object({
        dateDescription: z
          .string()
          .optional()
          .describe(
            'Date range (e.g., \'last year\', \'this quarter\'). Defaults to this month. Example: "last 6 months" or "2023-01,2023-12"',
          ),
        accountIdentifier: z
          .string()
          .optional()
          .describe(
            'Optional: Filter by account name or ID. Example: "Investment Account" or "acc_456"',
          ),
      }),
      execute: async ({ dateDescription, accountIdentifier }) => {
        try {
          let accountId: string | undefined = undefined;
          if (accountIdentifier) {
            const accountRes = await resolveAccountId(userId, accountIdentifier);
            if ('error' in accountRes)
              return createToolResponse({ success: false, error: accountRes.error });
            if ('clarificationNeeded' in accountRes)
              return createToolResponse({
                success: true,
                clarificationNeeded: true,
                message: 'Which account?',
                options: accountRes.options,
              });
            accountId = accountRes.id;
          }

          const updatedDateRange = parseNaturalLanguageDateRange(dateDescription);

          const result = await transactionService.getIncomeExpenseChartData(
            userId,
            accountId,
            `${updatedDateRange?.startDate.toISOString()},${updatedDateRange?.endDate.toISOString()}`,
          );

          const typedResult = result as any;

          if (!typedResult || !typedResult.date || typedResult.date.length === 0) {
            const period = dateDescription || 'this month';
            return createToolResponse({
              success: true,
              message: `No income or expense trend data found for ${period}${
                accountId ? ` in account "${accountIdentifier}"` : ''
              }.`,
            });
          }

          const period = dateDescription || 'this month';
          const accountMsg = accountId ? ` for account "${accountIdentifier}"` : '';
          const message = `Trend data for income, expense, and balance over ${period}${accountMsg} retrieved.`;

          const trendChartData = typedResult.date.map((date: string, index: number) => ({
            date,
            Income: typedResult.income[index] || 0,
            Expense: typedResult.expense[index] || 0,
            Balance: typedResult.balance[index] || 0,
          }));

          return createToolResponse({
            success: true,
            message: message,
            data: typedResult,
            chart:
              trendChartData.length > 0
                ? {
                    type: 'line',
                    data: trendChartData,
                    title: `Income vs. Expense Trend for ${dateDescription || 'this month'}`,
                  }
                : undefined,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getAccountAnalyticsSummary: tool({
      description:
        'Retrieves key financial analytics (total income, total expense, balance, and percentage changes) for a specific account over a specified date range.',
      parameters: z.object({
        accountIdentifier: z
          .string()
          .min(1)
          .describe('The name or ID of the account. Example: "My Checking Account" or "acc_789"'),
        dateDescription: z
          .string()
          .optional()
          .describe(
            'Date range (e.g., \'this month\', \'last quarter\'). Defaults to this month. Example: "this quarter" or "last year"',
          ),
      }),
      execute: async ({ accountIdentifier, dateDescription }) => {
        try {
          const accountRes = await resolveAccountId(userId, accountIdentifier);
          if ('error' in accountRes)
            return createToolResponse({ success: false, error: accountRes.error });
          if ('clarificationNeeded' in accountRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which account do you mean?',
              options: accountRes.options,
            });
          const accountId = accountRes.id;

          const updatedDateRange = parseNaturalLanguageDateRange(dateDescription);

          const duration = `${updatedDateRange?.startDate.toISOString()},${updatedDateRange?.endDate.toISOString()}`;

          const analytics = await accountService.getCustomAnalytics(accountId, userId, duration);

          if (!analytics) {
            const period = dateDescription;
            return createToolResponse({
              success: true,
              message: `No analytics data found for account "${accountIdentifier}" for ${period}.`,
            });
          }

          const accountDetails = await accountService.getAccountById(accountId, userId);
          const currency = accountDetails?.currency || 'INR';

          const period = dateDescription;
          const message = `Analytics for account "${accountIdentifier}" for ${period}: Income ${formatCurrency(
            analytics.income,
            currency,
          )} (${analytics.IncomePercentageChange.toFixed(1)}% change), Expenses ${formatCurrency(
            analytics.expense,
            currency,
          )} (${analytics.ExpensePercentageChange.toFixed(
            1,
          )}% change), Net Balance ${formatCurrency(
            analytics.balance,
            currency,
          )} (${analytics.BalancePercentageChange.toFixed(1)}% change).`;

          return createToolResponse({
            success: true,
            message: message,
            data: analytics,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),
  };
}
