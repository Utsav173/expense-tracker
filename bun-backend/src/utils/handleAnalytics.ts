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
    .where(
      and(eq(Transaction.account, account), eq(Transaction.isIncome, isIncome))
    )
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
    const oldValue = income ?? expense ?? 0;

    const parseAmount = parseFloat(amount.toString());
    const newValue = parseFloat(oldValue?.toString()) + parseAmount;

    if (isNaN(parseAmount)) {
      throw new Error('Invalid amount');
    }

    const percentageChange = ((newValue - oldValue) / oldValue) * 100;

    const updatedAnalytics = {
      updatedBy: user,
      [isIncome ? 'income' : 'expense']: newValue,
      balance:
        parseFloat(balance?.toString() ?? '0') +
        (isIncome ? parseAmount : -parseAmount),
      [isIncome ? 'previousIncome' : 'previousExpense']: parseAmount,
      [isIncome ? 'incomePercentageChange' : 'expensePercentageChange']:
        percentageChange,
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
      .set({ balance: updatedAnalytics.balance })
      .where(eq(Account.id, account))
      .then(() => {
        return;
      })
      .catch((err) => {
        throw new Error(err.message);
      });
  }
}
