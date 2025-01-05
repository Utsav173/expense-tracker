import { and, desc, eq } from 'drizzle-orm';
import { db } from '../database';
import { Account, Analytics, Transaction } from '../database/schema';

export default async function handleAnalytics({
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
