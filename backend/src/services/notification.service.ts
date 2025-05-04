import { db } from '../database';
import { Budget, SavingGoal, Transaction, User, Category } from '../database/schema';
import { emailService } from './email.service';
import { and, eq, gt, isNull, lte, sql, gte, sum, ne, or, desc, isNotNull } from 'drizzle-orm';
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
  format,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isEqual,
  isAfter,
  parseISO,
} from 'date-fns';
import {
  budgetAlertEmailTemp,
  goalReminderEmailTemp,
  billReminderEmailTemp,
} from '../utils/email.utils';
import { recurringTransactionService } from './recurring.service';
import { HTTPException } from 'hono/http-exception';

const BUDGET_ALERT_THRESHOLD = 0.9;
const GOAL_REMINDER_DAYS = 7;
const BILL_REMINDER_DAYS = 3;

class NotificationService {
  async checkBudgetAlerts() {
    console.log('Checking for budget alerts...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    try {
      const budgets = await db.query.Budget.findMany({
        where: and(
          eq(Budget.month, currentMonth),
          eq(Budget.year, currentYear),
          gt(Budget.amount, 0),
        ),
        with: {
          user: { columns: { id: true, email: true, name: true, preferredCurrency: true } },
          category: { columns: { id: true, name: true } },
        },
      });

      if (!budgets.length) {
        console.log('No budgets found for the current period.');
        return { alerted: 0, errors: 0 };
      }

      let alertedCount = 0;
      let errorCount = 0;

      for (const budget of budgets) {
        if (!budget.user || !budget.category?.id) {
          console.warn(`Skipping budget ${budget.id} due to missing user or category relation.`);
          continue;
        }

        try {
          const spendingResult = await db
            .select({
              totalSpent: sql<number>`COALESCE(SUM(${Transaction.amount}), 0)`.mapWith(Number),
            })
            .from(Transaction)
            .where(
              and(
                eq(Transaction.owner, budget.userId),
                eq(Transaction.category, budget.category.id),
                eq(Transaction.isIncome, false),
                gte(Transaction.createdAt, monthStart),
                lte(Transaction.createdAt, monthEnd),
              ),
            )
            .then((res) => res[0]);

          const spentAmount = spendingResult?.totalSpent ?? 0;
          const budgetedAmount = budget.amount;
          const percentageSpent = budgetedAmount > 0 ? spentAmount / budgetedAmount : 0;

          const budgetDetails = {
            categoryName: budget.category.name ?? 'Unknown Category',
            budgetedAmount: budgetedAmount,
            spentAmount: spentAmount,
            period: format(now, 'MMMM yyyy'),
            currency: budget.user.preferredCurrency ?? 'INR',
          };

          if (percentageSpent >= 1) {
            console.log(
              `Budget exceeded for user ${budget.userId}, category ${budgetDetails.categoryName}`,
            );
            await emailService.sendBudgetAlertEmail(
              budget.user.email,
              budget.user.name,
              budgetDetails,
              'exceeded',
            );
            alertedCount++;
          } else if (percentageSpent >= BUDGET_ALERT_THRESHOLD) {
            console.log(
              `Budget approaching for user ${budget.userId}, category ${budgetDetails.categoryName}`,
            );
            await emailService.sendBudgetAlertEmail(
              budget.user.email,
              budget.user.name,
              budgetDetails,
              'approaching',
            );
            alertedCount++;
          }
        } catch (err: any) {
          console.error(`Error processing budget alert for budget ${budget.id}:`, err.message);
          errorCount++;
        }
      }
      console.log(`Budget alert check finished. Alerted: ${alertedCount}, Errors: ${errorCount}`);
      return { alerted: alertedCount, errors: errorCount };
    } catch (error: any) {
      console.error('Failed to fetch budgets for alerts:', error);
      return { alerted: 0, errors: 1 };
    }
  }

  async checkGoalReminders() {
    console.log('Checking for goal reminders...');
    const now = new Date();
    const reminderCutoffDate = addDays(now, GOAL_REMINDER_DAYS);

    try {
      const goalsToRemind = await db.query.SavingGoal.findMany({
        where: and(
          isNotNull(SavingGoal.targetDate),
          lte(SavingGoal.targetDate, reminderCutoffDate),
          gt(SavingGoal.targetDate, now),
          sql`${SavingGoal.savedAmount} < ${SavingGoal.targetAmount}`,
        ),
        with: {
          user: { columns: { id: true, email: true, name: true, preferredCurrency: true } },
        },
      });

      if (!goalsToRemind.length) {
        console.log('No goals found needing reminders.');
        return { reminded: 0, errors: 0 };
      }

      let remindedCount = 0;
      let errorCount = 0;

      for (const goal of goalsToRemind) {
        if (!goal.user || !goal.targetDate) continue;

        try {
          const remainingAmount = Math.max(0, (goal.targetAmount ?? 0) - (goal.savedAmount ?? 0));
          console.log(`Sending goal reminder for user ${goal.userId}, goal ${goal.name}`);
          await emailService.sendGoalReminderEmail(goal.user.email, goal.user.name, {
            goalName: goal.name,
            targetDate: format(goal.targetDate, 'MMMM d, yyyy'),
            remainingAmount: remainingAmount,
            currency: goal.user.preferredCurrency ?? 'INR',
          });
          remindedCount++;
        } catch (err: any) {
          console.error(`Error sending reminder for goal ${goal.id}:`, err.message);
          errorCount++;
        }
      }
      console.log(
        `Goal reminder check finished. Reminded: ${remindedCount}, Errors: ${errorCount}`,
      );
      return { reminded: remindedCount, errors: errorCount };
    } catch (error: any) {
      console.error('Failed to fetch goals for reminders:', error);
      return { reminded: 0, errors: 1 };
    }
  }

  async checkBillReminders() {
    console.log('Checking for bill payment reminders...');
    const now = new Date();
    const todayStart = startOfDay(now);
    const reminderCutoffDate = endOfDay(addDays(now, BILL_REMINDER_DAYS));

    try {
      const templates = await db.query.Transaction.findMany({
        where: and(
          eq(Transaction.recurring, true),
          eq(Transaction.isIncome, false),
          or(isNull(Transaction.recurrenceEndDate), gt(Transaction.recurrenceEndDate, now)),
        ),

        with: {
          owner: {
            columns: { id: true, email: true, name: true, preferredCurrency: true },
          },
          account: {
            columns: { currency: true },
          },
        },
      });

      if (!templates.length) {
        console.log('No active recurring expense templates found for bill reminders.');
        return { reminded: 0, errors: 0 };
      }

      let remindedCount = 0;
      let errorCount = 0;

      for (const template of templates) {
        const user = template.owner;
        if (!user) {
          console.warn(`Skipping template ${template.id} due to missing user relation.`);
          continue;
        }

        try {
          const lastInstance = await db.query.Transaction.findFirst({
            where: and(
              eq(Transaction.owner, template.owner),
              eq(Transaction.account, template.account!),
              eq(Transaction.text, template.text),
              eq(Transaction.amount, template.amount),
              eq(Transaction.isIncome, template.isIncome),
              template.category ? eq(Transaction.category, template.category) : undefined,
              template.transfer ? eq(Transaction.transfer, template.transfer) : undefined,
              eq(Transaction.recurring, false),
            ),
            orderBy: [desc(Transaction.createdAt)],
            columns: { createdAt: true },
          });

          const lastOccurrenceDate = lastInstance?.createdAt ?? template.createdAt ?? new Date(0);
          let nextDueDate: Date | null = null;

          switch (template.recurrenceType) {
            case 'daily':
              nextDueDate = addDays(lastOccurrenceDate, 1);
              break;
            case 'weekly':
              nextDueDate = addWeeks(lastOccurrenceDate, 1);
              break;
            case 'monthly':
              nextDueDate = addMonths(lastOccurrenceDate, 1);
              break;
            case 'yearly':
              nextDueDate = addYears(lastOccurrenceDate, 1);
              break;
            default:
              continue;
          }
          nextDueDate = startOfDay(nextDueDate);

          if (
            (isAfter(nextDueDate, todayStart) || isEqual(nextDueDate, todayStart)) &&
            isBefore(nextDueDate, reminderCutoffDate)
          ) {
            console.log(`Sending bill reminder for user ${user.id}, bill "${template.text}"`);

            const accountCurrency = template.account?.currency;
            await emailService.sendBillReminderEmail(user.email, user.name, {
              description: template.text,
              amount: template.amount,
              dueDate: format(nextDueDate, 'MMMM d, yyyy'),
              currency: template.currency ?? accountCurrency ?? user.preferredCurrency ?? 'INR',
            });
            remindedCount++;
          }
        } catch (err: any) {
          console.error(`Error processing bill reminder for template ${template.id}:`, err.message);
          errorCount++;
        }
      }
      console.log(
        `Bill reminder check finished. Reminded: ${remindedCount}, Errors: ${errorCount}`,
      );
      return { reminded: remindedCount, errors: errorCount };
    } catch (error: any) {
      console.error('Failed to fetch recurring expenses for bill reminders:', error);
      return { reminded: 0, errors: 1 };
    }
  }
}

export const notificationService = new NotificationService();
