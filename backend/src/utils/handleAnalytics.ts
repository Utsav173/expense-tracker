import { and, desc, eq } from 'drizzle-orm';
import { db } from '../database';
import { Account, Analytics, Transaction } from '../database/schema';

export async function handleAnalytics({
  account,
  user,
  isIncome,
  amount,
}: {
  account: string;
  user: string;
  isIncome: boolean;
  amount: number;
}) {
  const analyticsData = await db
    .select({
      income: Analytics.income,
      expense: Analytics.expense,
      balance: Analytics.balance,
    })
    .from(Analytics)
    .where(eq(Analytics.account, account))
    .then((data) => {
      return data[0];
    })
    .catch((err) => {
      throw new Error(err.message);
    });

  const latestTransaction = await db
    .select()
    .from(Transaction)
    .where(and(eq(Transaction.account, account), eq(Transaction.isIncome, isIncome)))
    .limit(1)
    .orderBy(desc(Transaction.createdAt))
    .then((data) => {
      return data[0];
    })
    .catch((err) => {
      throw new Error(err.message);
    });

  if (analyticsData && latestTransaction) {
    const { balance, expense, income } = analyticsData;
    const oldValue = isIncome ? income : expense;
    const parseAmount = Number(amount);

    if (isNaN(parseAmount)) {
      throw new Error('Invalid amount');
    }

    const newValue = (Number(oldValue) || 0) + parseAmount;
    const newBalance = (Number(balance) || 0) + (isIncome ? parseAmount : -parseAmount);

    let percentageChange: number;
    if (oldValue === 0) {
      percentageChange = 100;
    } else {
      percentageChange = ((newValue - (Number(oldValue) || 0)) / (Number(oldValue) || 1)) * 100;
    }

    const updatedAnalytics = {
      updatedBy: user,
      [isIncome ? 'income' : 'expense']: newValue,
      balance: newBalance,
      [isIncome ? 'previousIncome' : 'previousExpenses']: parseAmount,
      [isIncome ? 'incomePercentageChange' : 'expensePercentageChange']: percentageChange,
    };

    await db
      .update(Analytics)
      .set(updatedAnalytics)
      .where(eq(Analytics.account, account))
      .then(() => {
        return;
      })
      .catch((err) => {
        throw new Error(err.message);
      });

    await db
      .update(Account)
      .set({ balance: newBalance })
      .where(eq(Account.id, account))
      .then(() => {
        return;
      })
      .catch((err) => {
        throw new Error(err.message);
      });
  }
}

export async function handleBulkAnalytics({
  accountId,
  userId,
  transactions,
}: {
  accountId: string;
  userId: string;
  transactions: { amount: number; isIncome: boolean }[];
}) {
  if (!transactions.length) {
    return; // No transactions to process
  }

  const initialAnalyticsData = await db
    .select({
      income: Analytics.income,
      expense: Analytics.expense,
      balance: Analytics.balance,
    })
    .from(Analytics)
    .where(eq(Analytics.account, accountId))
    .then((data) => data[0] || { income: 0, expense: 0, balance: 0 }) // Default values if not found
    .catch((err) => {
      throw new Error(err.message);
    });

  let totalIncomeChange = 0;
  let totalExpenseChange = 0;

  transactions.forEach((transaction) => {
    const parseAmount = Number(transaction.amount);
    if (isNaN(parseAmount)) {
      throw new Error('Invalid amount in transaction'); // Consider more robust error handling
    }
    if (transaction.isIncome) {
      totalIncomeChange += parseAmount;
    } else {
      totalExpenseChange += parseAmount;
    }
  });

  const newIncome = (Number(initialAnalyticsData.income) || 0) + totalIncomeChange;
  const newExpense = (Number(initialAnalyticsData.expense) || 0) + totalExpenseChange;
  const newBalance =
    (Number(initialAnalyticsData.balance) || 0) + totalIncomeChange - totalExpenseChange;

  const updatedAnalytics = {
    updatedBy: userId,
    income: newIncome,
    expense: newExpense,
    balance: newBalance,
    previousIncome: totalIncomeChange, // Consider how to handle "previous" values in bulk
    previousExpenses: totalExpenseChange,
    incomePercentageChange: calculatePercentageChange(initialAnalyticsData.income || 0, newIncome),
    expensePercentageChange: calculatePercentageChange(
      initialAnalyticsData.expense || 0,
      newExpense,
    ),
  };

  await db
    .update(Analytics)
    .set(updatedAnalytics)
    .where(eq(Analytics.account, accountId))
    .catch((err) => {
      throw new Error(err.message);
    });

  await db
    .update(Account)
    .set({ balance: newBalance })
    .where(eq(Account.id, accountId))
    .catch((err) => {
      throw new Error(err.message);
    });
}

function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return 100;
  }
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}
