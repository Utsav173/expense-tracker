import { db } from '../database';
import { Transaction } from '../database/schema';
import { transactionService } from './transaction.service';
import { and, eq, gt, isNull, lte, desc, sql, or } from 'drizzle-orm';
import { addDays, addWeeks, addMonths, addYears, startOfDay, isBefore, isEqual } from 'date-fns';
import { HTTPException } from 'hono/http-exception';

class RecurringTransactionService {
  async generateDueTransactions() {
    console.log('Starting recurring transaction generation job...');
    const now = new Date();
    const todayStart = startOfDay(now);

    try {
      const templates = await db.query.Transaction.findMany({
        where: and(
          eq(Transaction.recurring, true),
          or(isNull(Transaction.recurrenceEndDate), gt(Transaction.recurrenceEndDate, now)),
        ),
        with: {
          account: { columns: { currency: true } },
        },
      });

      if (!templates.length) {
        console.log('No active recurring transaction templates found.');
        return { generated: 0, skipped: 0, errors: 0 };
      }

      console.log(`Found ${templates.length} active recurring templates to check.`);

      let generatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const template of templates) {
        // Basic check: Ensure the template has an associated account ID
        if (!template.account) {
          console.warn(`Skipping template ${template.id}: Missing account ID.`);
          skippedCount++;
          continue;
        }

        try {
          const lastInstance = await db.query.Transaction.findFirst({
            where: and(
              eq(Transaction.owner, template.owner),
              eq(Transaction.account, template.account), // Safe to use ! here due to check above
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
              console.warn(
                `Skipping template ${template.id} due to invalid recurrenceType: ${template.recurrenceType}`,
              );
              skippedCount++;
              continue;
          }

          nextDueDate = startOfDay(nextDueDate);

          if (isBefore(nextDueDate, todayStart) || isEqual(nextDueDate, todayStart)) {
            if (!template.recurrenceEndDate || isBefore(nextDueDate, template.recurrenceEndDate)) {
              console.log(
                `Generating transaction for template ${template.id}, due on ${
                  nextDueDate.toISOString().split('T')[0]
                }`,
              );

              // Access currency from the eager-loaded relation
              const accountCurrency = template.account?.currency;

              await transactionService.createTransaction(
                template.owner, // Pass owner ID as the 'creator' for logging
                {
                  text: template.text,
                  amount: template.amount,
                  isIncome: template.isIncome,
                  transfer: template.transfer,
                  category: template.category,
                  account: template.account, // Pass account ID
                  currency: template.currency ?? accountCurrency ?? 'INR', // Use currency hierarchy
                  createdAt: new Date(nextDueDate.toISOString()),
                  recurring: false,
                  recurrenceType: null,
                  recurrenceEndDate: null,
                  owner: template.owner, // Ensure owner is set
                  createdBy: template.owner, // Log who owned the template
                },
                true, // <-- Pass true to bypass owner check
              );
              generatedCount++;
            } else {
              console.log(
                `Skipping template ${template.id}: Next due date ${
                  nextDueDate.toISOString().split('T')[0]
                } is after end date ${template.recurrenceEndDate.toISOString().split('T')[0]}.`,
              );
              skippedCount++;
            }
          } else {
            skippedCount++;
          }
        } catch (instanceError: any) {
          console.error(`Error processing template ${template.id}:`, instanceError.message);
          errorCount++;
        }
      }

      console.log(
        `Recurring transaction job finished. Generated: ${generatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
      );
      return { generated: generatedCount, skipped: skippedCount, errors: errorCount };
    } catch (error: any) {
      console.error('Failed to fetch recurring transaction templates:', error);
      throw new HTTPException(500, { message: 'Failed to run recurring transaction job.' });
    }
  }
}

export const recurringTransactionService = new RecurringTransactionService();
