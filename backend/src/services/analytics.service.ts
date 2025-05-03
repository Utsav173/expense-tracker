// src/services/analytics.service.ts
import { db } from '../database';
import { Account, Analytics } from '../database/schema';
import { eq, SQL, sql } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { NeonQueryResultHKT } from 'drizzle-orm/neon-serverless';
import * as schema from '../database/schema';
import { ExtractTablesWithRelations } from 'drizzle-orm';

// Define a type for the transaction client that can be passed around
type TransactionClient = PgTransaction<
  NeonQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
type DbClient = typeof db | TransactionClient; // Allow either base db or transaction client

// Utility to calculate percentage change safely (can be moved to a utils file)
export function calculatePercentageChange(
  oldValue: number | null | undefined,
  newValue: number | null | undefined,
): number {
  const oldNum = Number(oldValue) || 0;
  const newNum = Number(newValue) || 0;

  if (oldNum === 0) {
    // Handle division by zero: if new value increased from 0, return 100%, otherwise 0%
    return newNum > 0 ? 100 : 0;
  }
  // Ensure we don't divide by zero if oldNum became 0 somehow after Number()
  // This check might be redundant due to the previous one, but safe to keep.
  if (oldNum === 0) return 0;

  const change = ((newNum - oldNum) / Math.abs(oldNum)) * 100;
  // Handle potential NaN if numbers are extreme or invalid
  return isNaN(change) ? 0 : change;
}

export class AnalyticsService {
  /**
   * Updates analytics and account balance for a single transaction.
   * Should be called within a database transaction for atomicity.
   */
  async handleAnalyticsUpdate(params: {
    account: string;
    user: string; // ID of the user performing the action (for potential audit/linking)
    isIncome: boolean;
    amount: number;
    tx?: DbClient; // Accept optional transaction client
  }) {
    const { account: accountId, user: userId, isIncome, amount, tx = db } = params;
    const dbClient = tx; // Use transaction client if provided, else default db

    if (isNaN(Number(amount))) {
      console.error(
        `Invalid amount provided to handleAnalytics for account ${accountId}: ${amount}`,
      );
      throw new Error('Invalid amount provided to handleAnalytics');
    }
    const parsedAmount = Number(amount);

    // 1. Get current analytics data using the correct client (tx or db)
    const currentAnalytics = await dbClient.query.Analytics.findFirst({
      where: eq(Analytics.account, accountId),
    });

    let currentIncome = 0;
    let currentExpense = 0;
    let currentBalance = 0;

    if (!currentAnalytics) {
      // Analytics record doesn't exist, create it. Assume account exists.
      const accountOwnerResult = await dbClient.query.Account.findFirst({
        where: eq(Account.id, accountId),
        columns: { owner: true },
      });
      if (!accountOwnerResult) {
        // This indicates a bigger problem - an account exists without an owner or the account ID is wrong
        throw new Error(`Account ${accountId} not found when trying to create analytics.`);
      }
      console.warn(`Analytics record not found for account ${accountId}. Creating one.`);
      currentIncome = isIncome ? parsedAmount : 0;
      currentExpense = !isIncome ? parsedAmount : 0;
      currentBalance = isIncome ? parsedAmount : -parsedAmount;

      await dbClient.insert(Analytics).values({
        account: accountId,
        user: accountOwnerResult.owner, // Use the actual owner of the account
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
      // Analytics record exists, calculate new values based on current state
      currentIncome = Number(currentAnalytics.income ?? 0);
      currentExpense = Number(currentAnalytics.expense ?? 0);
      currentBalance = Number(currentAnalytics.balance ?? 0);

      const newIncome = currentIncome + (isIncome ? parsedAmount : 0);
      const newExpense = currentExpense + (!isIncome ? parsedAmount : 0);
      const newBalance = currentBalance + (isIncome ? parsedAmount : -parsedAmount);

      // Update Analytics table
      await dbClient
        .update(Analytics)
        .set({
          income: newIncome,
          expense: newExpense,
          balance: newBalance,
          // Store this single transaction's effect as 'previous'
          previousIncome: isIncome ? parsedAmount : currentAnalytics.previousIncome,
          previousExpenses: !isIncome ? parsedAmount : currentAnalytics.previousExpenses,
          previousBalance: currentBalance, // Store balance *before* this change
          // Calculate % change based on the new totals vs the *old* totals
          incomePercentageChange: calculatePercentageChange(currentIncome, newIncome),
          expensesPercentageChange: calculatePercentageChange(currentExpense, newExpense),
          updatedAt: new Date(),
        })
        .where(eq(Analytics.account, accountId))
        .catch((err) => {
          console.error(`Failed to update analytics for account ${accountId}: ${err.message}`);
          throw new Error(`Failed to update analytics for account ${accountId}: ${err.message}`);
        });
      currentBalance = newBalance; // Update currentBalance for account update
    }

    // 4. Update Account balance (always update based on the final calculated balance)
    await dbClient
      .update(Account)
      .set({
        balance: currentBalance, // Use the final calculated balance
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
    userId, // ID of the user initiating the bulk operation
    transactions,
    tx = db, // Optional transaction client
  }: {
    accountId: string;
    userId: string; // Keep userId for potential future use (e.g., audit logging)
    transactions: { amount: number; isIncome: boolean }[];
    tx?: DbClient; // Use the flexible DbClient type
  }) {
    if (!transactions.length) {
      console.warn(`handleBulkAnalytics called with empty transactions for account ${accountId}`);
      return;
    }
    const dbClient = tx;

    // 1. Calculate total changes from the batch
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
        return; // Skip this transaction
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
      return; // No need to update if nothing changed
    }

    // 2. Get current analytics data
    const currentAnalytics = await dbClient.query.Analytics.findFirst({
      where: eq(Analytics.account, accountId),
    });

    if (!currentAnalytics) {
      // Handle missing analytics record - Needs the account owner to create.
      // Fetch owner ID first.
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
        user: accountOwnerResult.owner, // Use actual owner
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
      // Update account balance as well
      await dbClient
        .update(Account)
        .set({ balance: newAnalyticsRecord.balance, updatedAt: new Date() })
        .where(eq(Account.id, accountId));
      return; // Exit after creating
    }

    // 3. Calculate new totals using current state + changes
    const currentIncome = Number(currentAnalytics.income ?? 0);
    const currentExpense = Number(currentAnalytics.expense ?? 0);
    const currentBalance = Number(currentAnalytics.balance ?? 0);

    const newIncome = currentIncome + totalIncomeChange;
    const newExpense = currentExpense + totalExpenseChange;
    const newBalance = currentBalance + totalBalanceChange;

    // 4. Update Analytics and Account tables
    await dbClient
      .update(Analytics)
      .set({
        income: newIncome,
        expense: newExpense,
        balance: newBalance,
        // 'previous' fields represent the state *before* this batch for % change calc
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
        balance: newBalance, // Set the final calculated balance
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
    incomeChange: number; // Positive if income increased, negative if decreased
    expenseChange: number; // Positive if expense increased, negative if decreased
    balanceChange: number; // Net change in balance (incomeChange - expenseChange)
    tx?: DbClient; // Use flexible DbClient type
  }) {
    const { accountId, incomeChange, expenseChange, balanceChange, tx = db } = params;
    const dbClient = tx;

    if (incomeChange === 0 && expenseChange === 0 && balanceChange === 0) {
      console.warn(
        `updateAnalyticsForTransactionChange called with no changes for account ${accountId}`,
      );
      return; // No changes to apply
    }

    // Update Analytics using the increment helper which handles potential nulls in the DB columns
    // We fetch the *current* values first to calculate the new percentage changes accurately.
    const currentAnalytics = await dbClient.query.Analytics.findFirst({
      where: eq(Analytics.account, accountId),
    });

    if (!currentAnalytics) {
      // This case should ideally not happen if a transaction existed for the account.
      console.error(
        `Analytics record not found for account ${accountId} during transaction change update.`,
      );
      // Depending on requirements, either throw or log and potentially skip update.
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
        // Update previous values to reflect the state *before* this change was reverted/applied
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

    // Note: The calling function (e.g., deleteTransaction, updateTransaction)
    // is responsible for updating the Account.balance itself using the balanceChange.
  }
}

export const analyticsService = new AnalyticsService();
