// src/services/goal.service.ts
import { db } from '../database';
import { SavingGoal } from '../database/schema';
import {
  InferInsertModel,
  SQL,
  asc,
  count,
  desc,
  eq,
  sql,
  and,
  AnyColumn,
  InferSelectModel,
} from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { parseISO, isValid as isValidDate } from 'date-fns';

export class GoalService {
  async getGoals(
    userId: string,
    page: number,
    limit: number,
    sortBy: keyof InferSelectModel<typeof SavingGoal>,
    sortOrder: 'asc' | 'desc',
  ) {
    const sortColumn = SavingGoal[sortBy] || SavingGoal.createdAt; // Default sort
    const orderByClause =
      sortOrder === 'asc' ? asc(sortColumn as AnyColumn) : desc(sortColumn as AnyColumn);

    const totalResult = await db
      .select({ count: count() })
      .from(SavingGoal)
      .where(eq(SavingGoal.userId, userId))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });

    const total = totalResult[0]?.count ?? 0;

    const savingGoals = await db.query.SavingGoal.findMany({
      where: eq(SavingGoal.userId, userId),
      limit: limit,
      offset: limit * (page - 1),
      orderBy: [orderByClause],
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
    });

    return {
      data: savingGoals,
      pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
    };
  }

  async createGoal(
    userId: string,
    payload: Pick<InferInsertModel<typeof SavingGoal>, 'name' | 'targetAmount' | 'targetDate'>,
  ) {
    const { name, targetAmount, targetDate } = payload;

    if (isNaN(Number(targetAmount)) || targetAmount <= 0) {
      throw new HTTPException(400, { message: 'Invalid target amount.' });
    }

    let parsedTargetDate: Date | null = null;
    if (targetDate) {
      parsedTargetDate = targetDate instanceof Date ? targetDate : parseISO(targetDate as string);
      if (!isValidDate(parsedTargetDate)) {
        throw new HTTPException(400, { message: 'Invalid target date format.' });
      }
    }

    const newSavingGoal = await db
      .insert(SavingGoal)
      .values({
        userId: userId,
        name: name,
        targetAmount: Number(targetAmount),
        savedAmount: 0, // Initialize saved amount to 0
        targetDate: parsedTargetDate,
        createdAt: new Date(),
      })
      .returning()
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Insert Error: ${err.message}` });
      });

    if (!newSavingGoal || newSavingGoal.length === 0) {
      throw new HTTPException(500, { message: 'Failed to create saving goal.' });
    }

    return newSavingGoal[0];
  }

  async updateGoal(
    goalId: string,
    userId: string,
    payload: Partial<
      Pick<
        InferInsertModel<typeof SavingGoal>,
        'name' | 'targetAmount' | 'targetDate' | 'savedAmount'
      >
    >,
  ) {
    const { name, targetAmount, targetDate, savedAmount } = payload;

    // Verify user owns the goal
    const existingGoal = await db.query.SavingGoal.findFirst({
      where: and(eq(SavingGoal.id, goalId), eq(SavingGoal.userId, userId)),
    });
    if (!existingGoal) {
      throw new HTTPException(404, { message: 'Saving goal not found or access denied.' });
    }

    const updateData: Partial<InferInsertModel<typeof SavingGoal>> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (targetAmount !== undefined) {
      const amount = Number(targetAmount);
      if (isNaN(amount) || amount <= 0)
        throw new HTTPException(400, { message: 'Invalid target amount.' });
      updateData.targetAmount = amount;
    }
    if (savedAmount !== undefined) {
      const amount = Number(savedAmount);
      if (isNaN(amount) || amount < 0)
        throw new HTTPException(400, { message: 'Invalid saved amount.' });
      updateData.savedAmount = amount;
    }

    if (targetDate !== undefined && targetDate !== null) {
      const parsedDate = targetDate instanceof Date ? targetDate : parseISO(targetDate as string);
      if (!isValidDate(parsedDate))
        throw new HTTPException(400, { message: 'Invalid target date format.' });
      updateData.targetDate = parsedDate;
    } else if (targetDate === null) {
      updateData.targetDate = null;
    }

    if (Object.keys(updateData).length === 1) {
      // Only updatedAt
      return { message: 'No changes provided.', id: goalId };
    }

    const result = await db
      .update(SavingGoal)
      .set(updateData)
      .where(eq(SavingGoal.id, goalId))
      .returning({ id: SavingGoal.id })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Update Error: ${err.message}` });
      });

    if (result.length === 0) {
      throw new HTTPException(500, { message: 'Failed to update saving goal.' });
    }

    return { message: 'Goal updated successfully!', id: goalId };
  }

  async addAmountToGoal(goalId: string, userId: string, amount: number) {
    if (isNaN(Number(amount)) || amount <= 0) {
      throw new HTTPException(400, { message: 'Invalid amount to add. Must be positive.' });
    }

    // Verify user owns the goal
    const existingGoal = await db.query.SavingGoal.findFirst({
      where: and(eq(SavingGoal.id, goalId), eq(SavingGoal.userId, userId)),
      columns: { id: true },
    });
    if (!existingGoal) {
      throw new HTTPException(404, { message: 'Saving goal not found or access denied.' });
    }

    const result = await db
      .update(SavingGoal)
      .set({
        savedAmount: sql`${SavingGoal.savedAmount} + ${Number(amount)}`,
        updatedAt: new Date(),
      })
      .where(eq(SavingGoal.id, goalId))
      .returning({ id: SavingGoal.id, savedAmount: SavingGoal.savedAmount }) // Return updated amount
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Update Error: ${err.message}` });
      });

    if (result.length === 0) {
      throw new HTTPException(500, { message: 'Failed to add amount to saving goal.' });
    }

    return {
      message: 'Amount added successfully!',
      id: goalId,
      newSavedAmount: result[0].savedAmount,
    };
  }

  async withdrawAmountFromGoal(goalId: string, userId: string, amount: number) {
    if (isNaN(Number(amount)) || amount <= 0) {
      throw new HTTPException(400, { message: 'Invalid amount to withdraw. Must be positive.' });
    }

    // Verify user owns the goal and has sufficient saved amount
    const existingGoal = await db.query.SavingGoal.findFirst({
      where: and(eq(SavingGoal.id, goalId), eq(SavingGoal.userId, userId)),
      columns: { id: true, savedAmount: true },
    });
    if (!existingGoal) {
      throw new HTTPException(404, { message: 'Saving goal not found or access denied.' });
    }
    if ((existingGoal.savedAmount ?? 0) < Number(amount)) {
      throw new HTTPException(400, { message: 'Withdrawal amount exceeds saved amount.' });
    }

    const result = await db
      .update(SavingGoal)
      .set({
        savedAmount: sql`${SavingGoal.savedAmount} - ${Number(amount)}`,
        updatedAt: new Date(),
      })
      .where(eq(SavingGoal.id, goalId))
      .returning({ id: SavingGoal.id, savedAmount: SavingGoal.savedAmount })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Update Error: ${err.message}` });
      });

    if (result.length === 0) {
      throw new HTTPException(500, { message: 'Failed to withdraw amount from saving goal.' });
    }

    return {
      message: 'Amount withdrawn successfully!',
      id: goalId,
      newSavedAmount: result[0].savedAmount,
    };
  }

  async deleteGoal(goalId: string, userId: string) {
    // Verify user owns the goal
    const existingGoal = await db.query.SavingGoal.findFirst({
      where: and(eq(SavingGoal.id, goalId), eq(SavingGoal.userId, userId)),
      columns: { id: true },
    });
    if (!existingGoal) {
      throw new HTTPException(404, { message: 'Saving goal not found or access denied.' });
    }

    const result = await db
      .delete(SavingGoal)
      .where(eq(SavingGoal.id, goalId))
      .returning({ id: SavingGoal.id })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Delete Error: ${err.message}` });
      });

    if (result.length === 0) {
      throw new HTTPException(500, { message: 'Failed to delete saving goal.' });
    }

    return { message: 'Saving Goal Deleted successfully!' };
  }
}

export const goalService = new GoalService();
