import { db } from '../database';
import { Account, Analytics } from '../database/schema';
import { eq, SQL, sql } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { NeonQueryResultHKT } from 'drizzle-orm/neon-serverless';
import * as schema from '../database/schema';
import { ExtractTablesWithRelations } from 'drizzle-orm';

type TransactionClient = PgTransaction<
  NeonQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
type DbClient = typeof db | TransactionClient;

export function calculatePercentageChange(
  oldValue: number | null | undefined,
  newValue: number | null | undefined,
): number {
  const oldNum = Number(oldValue) || 0;
  const newNum = Number(newValue) || 0;

  if (oldNum === 0) {
    return newNum > 0 ? 100 : 0;
  }

  if (oldNum === 0) return 0;

  const change = ((newNum - oldNum) / Math.abs(oldNum)) * 100;

  return isNaN(change) ? 0 : change;
}

export class AnalyticsService {
  /**
   * Updates analytics and account balance for a single transaction.
   * Should be called within a database transaction for atomicity.
   */
  async handleAnalyticsUpdate(params: {
    account: string;
    user: string;
    isIncome: boolean;
    amount: number;
    tx?: DbClient;
  }) {
    const { account: accountId, user: userId, isIncome, amount, tx = db } = params;
    const dbClient = tx;

    if (isNaN(Number(amount))) {
      console.error(
        `Invalid amount provided to handleAnalytics for account ${accountId}: ${amount}`,
      );
      throw new Error('Invalid amount provided to handleAnalytics');
    }
    const parsedAmount = Number(amount);

    const currentAnalytics = await dbClient.query.Analytics.findFirst({
      where: eq(Analytics.account, accountId),
    });

    let currentIncome = 0;
    let currentExpense = 0;
    let currentBalance = 0;

    if (!currentAnalytics) {
      const accountOwnerResult = await dbClient.query.Account.findFirst({
        where: eq(Account.id, accountId),
        columns: { owner: true },
      });
      if (!accountOwnerResult) {
        throw new Error(`Account ${accountId} not found when trying to create analytics.`);
      }
      console.warn(`Analytics record not found for account ${accountId}. Creating one.`);
      currentIncome = isIncome ? parsedAmount : 0;
      currentExpense = !isIncome ? parsedAmount : 0;
      currentBalance = isIncome ? parsedAmount : -parsedAmount;

      await dbClient.insert(Analytics).values({
        account: accountId,
        user: accountOwnerResult.owner,
        income: currentIncome,
        expense: currentExpense,
        balance: currentBalance,
        previousIncome: 0,
        previousExpenses: 0,
        previousBalance: 0,
        incomePercentageChange: currentIncome > 0 ? 100 : 0,
        expensesPercentageChange: currentExpense > 0 ? 100 : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      currentIncome = Number(currentAnalytics.income ?? 0);
      currentExpense = Number(currentAnalytics.expense ?? 0);
      currentBalance = Number(currentAnalytics.balance ?? 0);

      const newIncome = currentIncome + (isIncome ? parsedAmount : 0);
      const newExpense = currentExpense + (!isIncome ? parsedAmount : 0);
      const newBalance = currentBalance + (isIncome ? parsedAmount : -parsedAmount);

      await dbClient
        .update(Analytics)
        .set({
          income: newIncome,
          expense: newExpense,
          balance: newBalance,

          previousIncome: isIncome ? parsedAmount : currentAnalytics.previousIncome,
          previousExpenses: !isIncome ? parsedAmount : currentAnalytics.previousExpenses,
          previousBalance: currentBalance,

          incomePercentageChange: calculatePercentageChange(currentIncome, newIncome),
          expensesPercentageChange: calculatePercentageChange(currentExpense, newExpense),
          updatedAt: new Date(),
        })
        .where(eq(Analytics.account, accountId))
        .catch((err) => {
          console.error(`Failed to update analytics for account ${accountId}: ${err.message}`);
          throw new Error(`Failed to update analytics for account ${accountId}: ${err.message}`);
        });
      currentBalance = newBalance;
    }

    await dbClient
      .update(Account)
      .set({
        balance: currentBalance,
        updatedAt: new Date(),
      })
      .where(eq(Account.id, accountId))
      .catch((err) => {
        console.error(`Failed to update account balance for ${accountId}: ${err.message}`);
        throw new Error(`Failed to update account balance for ${accountId}: ${err.message}`);
      });
  }

  /**
   * Updates analytics and account balance for a batch of transactions.
   * Assumes all transactions are for the SAME accountId.
   * Should be called within a database transaction for atomicity.
   */
  async handleBulkAnalytics({
    accountId,
    userId,
    transactions,
    tx = db,
  }: {
    accountId: string;
    userId: string;
    transactions: { amount: number; isIncome: boolean }[];
    tx?: DbClient;
  }) {
    if (!transactions.length) {
      console.warn(`handleBulkAnalytics called with empty transactions for account ${accountId}`);
      return;
    }
    const dbClient = tx;

    let totalIncomeChange = 0;
    let totalExpenseChange = 0;
    let invalidAmountCount = 0;

    transactions.forEach((transaction) => {
      const parsedAmount = Number(transaction.amount);
      if (isNaN(parsedAmount)) {
        invalidAmountCount++;
        console.error(
          `Invalid amount encountered in bulk transactions for account ${accountId}: ${transaction.amount}`,
        );
        return;
      }
      if (transaction.isIncome) {
        totalIncomeChange += parsedAmount;
      } else {
        totalExpenseChange += parsedAmount;
      }
    });

    if (invalidAmountCount > 0) {
      console.warn(
        `Skipped ${invalidAmountCount} transactions with invalid amounts during bulk update for account ${accountId}.`,
      );
    }

    const totalBalanceChange = totalIncomeChange - totalExpenseChange;

    if (totalBalanceChange === 0 && totalIncomeChange === 0 && totalExpenseChange === 0) {
      console.log(`No net change in bulk analytics for account ${accountId}. Skipping DB update.`);
      return;
    }

    const currentAnalytics = await dbClient.query.Analytics.findFirst({
      where: eq(Analytics.account, accountId),
    });

    if (!currentAnalytics) {
      const accountOwnerResult = await dbClient.query.Account.findFirst({
        where: eq(Account.id, accountId),
        columns: { owner: true },
      });
      if (!accountOwnerResult) {
        throw new Error(
          `Account ${accountId} not found when trying to create analytics during bulk update.`,
        );
      }
      console.warn(
        `Analytics record not found for account ${accountId} during bulk update. Creating one.`,
      );
      const newAnalyticsRecord = {
        account: accountId,
        user: accountOwnerResult.owner,
        income: totalIncomeChange,
        expense: totalExpenseChange,
        balance: totalBalanceChange,
        previousIncome: 0,
        previousExpenses: 0,
        previousBalance: 0,
        incomePercentageChange: totalIncomeChange > 0 ? 100 : 0,
        expensesPercentageChange: totalExpenseChange > 0 ? 100 : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await dbClient.insert(Analytics).values(newAnalyticsRecord);

      await dbClient
        .update(Account)
        .set({ balance: newAnalyticsRecord.balance, updatedAt: new Date() })
        .where(eq(Account.id, accountId));
      return;
    }

    const currentIncome = Number(currentAnalytics.income ?? 0);
    const currentExpense = Number(currentAnalytics.expense ?? 0);
    const currentBalance = Number(currentAnalytics.balance ?? 0);

    const newIncome = currentIncome + totalIncomeChange;
    const newExpense = currentExpense + totalExpenseChange;
    const newBalance = currentBalance + totalBalanceChange;

    await dbClient
      .update(Analytics)
      .set({
        income: newIncome,
        expense: newExpense,
        balance: newBalance,

        previousIncome: currentIncome,
        previousExpenses: currentExpense,
        previousBalance: currentBalance,
        incomePercentageChange: calculatePercentageChange(currentIncome, newIncome),
        expensesPercentageChange: calculatePercentageChange(currentExpense, newExpense),
        updatedAt: new Date(),
      })
      .where(eq(Analytics.account, accountId))
      .catch((err) => {
        throw new Error(`Bulk Analytics Update Error: ${err.message}`);
      });

    await dbClient
      .update(Account)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(Account.id, accountId))
      .catch((err) => {
        throw new Error(`Bulk Account Balance Update Error: ${err.message}`);
      });
  }

  /**
   * Updates analytics totals based on a change (e.g., from deleting or updating a transaction).
   * Should be called within a database transaction.
   */
  async updateAnalyticsForTransactionChange(params: {
    accountId: string;
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
    tx?: DbClient;
  }) {
    const { accountId, incomeChange, expenseChange, balanceChange, tx = db } = params;
    const dbClient = tx;

    if (incomeChange === 0 && expenseChange === 0 && balanceChange === 0) {
      console.warn(
        `updateAnalyticsForTransactionChange called with no changes for account ${accountId}`,
      );
      return;
    }

    const currentAnalytics = await dbClient.query.Analytics.findFirst({
      where: eq(Analytics.account, accountId),
    });

    if (!currentAnalytics) {
      console.error(
        `Analytics record not found for account ${accountId} during transaction change update.`,
      );

      throw new Error(
        `Analytics record not found for account ${accountId} during transaction change update.`,
      );
    }

    const oldIncome = Number(currentAnalytics.income ?? 0);
    const oldExpense = Number(currentAnalytics.expense ?? 0);
    const oldBalance = Number(currentAnalytics.balance ?? 0);

    const newIncome = oldIncome + incomeChange;
    const newExpense = oldExpense + expenseChange;
    const newBalance = oldBalance + balanceChange;

    await dbClient
      .update(Analytics)
      .set({
        income: newIncome,
        expense: newExpense,
        balance: newBalance,

        previousIncome: oldIncome,
        previousExpenses: oldExpense,
        previousBalance: oldBalance,
        incomePercentageChange: calculatePercentageChange(oldIncome, newIncome),
        expensesPercentageChange: calculatePercentageChange(oldExpense, newExpense),
        updatedAt: new Date(),
      })
      .where(eq(Analytics.account, accountId))
      .catch((err) => {
        throw new Error(
          `Failed to update analytics for transaction change on account ${accountId}: ${err.message}`,
        );
      });
  }
}

export const analyticsService = new AnalyticsService();
