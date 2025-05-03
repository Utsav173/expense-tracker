// src/services/investmentAccount.service.ts
import { db } from '../database';
import { Investment, InvestmentAccount } from '../database/schema';
import {
  InferInsertModel,
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  sql,
  sum,
  InferSelectModel,
  ne,
} from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export class InvestmentAccountService {
  async getInvestmentAccounts(
    userId: string,
    page: number,
    limit: number,
    sortBy: keyof InferSelectModel<typeof InvestmentAccount>,
    sortOrder: 'asc' | 'desc',
  ) {
    const sortColumn = InvestmentAccount[sortBy] || InvestmentAccount.createdAt;
    const orderByClause = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const totalResult = await db
      .select({ count: count() })
      .from(InvestmentAccount)
      .where(eq(InvestmentAccount.userId, userId))
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });

    const total = totalResult[0]?.count ?? 0;

    const investmentAccounts = await db.query.InvestmentAccount.findMany({
      where: eq(InvestmentAccount.userId, userId),
      limit: limit,
      offset: limit * (page - 1),
      orderBy: [orderByClause],
      // Optionally include related investments count or summary here if needed
      // with: { investments: { columns: { id: true } } } // Example to get count later
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
    });

    // If you need investment count per account, you might query it separately or adjust the above
    // For simplicity now, returning accounts directly.

    return {
      data: investmentAccounts,
      pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
    };
  }

  async getInvestmentAccountSummary(accountId: string, userId: string) {
    const accountCheck = await db.query.InvestmentAccount.findFirst({
      where: and(eq(InvestmentAccount.id, accountId), eq(InvestmentAccount.userId, userId)),
      columns: { id: true, name: true, currency: true, platform: true },
    });

    if (!accountCheck) {
      throw new HTTPException(404, { message: 'Investment account not found or access denied.' });
    }

    // Use Drizzle's aggregate functions for clarity and type safety
    const summaryResult = await db
      .select({
        totalInvestment: sum(Investment.investedAmount).mapWith(Number),
        totalDividend: sum(Investment.dividend).mapWith(Number),
        // totalShares: sum(Investment.shares).mapWith(Number) // If needed
      })
      .from(Investment)
      .where(eq(Investment.account, accountId))
      .groupBy(Investment.account) // Group by account ID is sufficient here
      .then((res) => res[0]) // Expecting one row or none
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Summary Error: ${err.message}` });
      });

    const totalInvestment = summaryResult?.totalInvestment ?? 0;
    const totalDividend = summaryResult?.totalDividend ?? 0;
    // Calculate total value (assuming it's investment + dividend for simplicity)
    const totalValue = totalInvestment + totalDividend;

    return {
      accountId: accountCheck.id, // Return ID for consistency
      accountname: accountCheck.name,
      currency: accountCheck.currency,
      platform: accountCheck.platform,
      totalinvestment: totalInvestment,
      totaldividend: totalDividend,
      totalvalue: totalValue, // Based on simple calculation
    };
  }

  async getInvestmentAccountById(accountId: string, userId: string) {
    const investmentAccount = await db.query.InvestmentAccount.findFirst({
      // Ensure user owns the account
      where: and(eq(InvestmentAccount.id, accountId), eq(InvestmentAccount.userId, userId)),
      // Optionally load related investments here if always needed
      // with: { investments: true }
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
    });

    if (!investmentAccount) {
      throw new HTTPException(404, { message: 'Investment account not found or access denied.' });
    }

    return investmentAccount;
  }

  async createInvestmentAccount(
    userId: string,
    payload: Pick<InferInsertModel<typeof InvestmentAccount>, 'name' | 'platform' | 'currency'>,
  ) {
    const { name, platform, currency } = payload;

    // Optionally check for duplicate account names for the same user
    const existingAccount = await db.query.InvestmentAccount.findFirst({
      where: and(eq(InvestmentAccount.name, name), eq(InvestmentAccount.userId, userId)),
      columns: { id: true },
    });
    if (existingAccount) {
      throw new HTTPException(409, {
        message: `An investment account named "${name}" already exists.`,
      });
    }

    const newInvestmentAcc = await db
      .insert(InvestmentAccount)
      .values({
        userId,
        name,
        platform,
        currency,
        createdAt: new Date(), // Explicitly set createdAt
      })
      .returning()
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Insert Error: ${err.message}` });
      });

    if (!newInvestmentAcc || newInvestmentAcc.length === 0) {
      throw new HTTPException(500, { message: 'Failed to create investment account.' });
    }

    return newInvestmentAcc[0];
  }

  async updateInvestmentAccount(
    accountId: string,
    userId: string,
    payload: Partial<Pick<InferInsertModel<typeof InvestmentAccount>, 'name' | 'platform'>>,
  ) {
    const { name, platform } = payload;

    // Verify ownership
    const account = await db.query.InvestmentAccount.findFirst({
      where: and(eq(InvestmentAccount.id, accountId), eq(InvestmentAccount.userId, userId)),
      columns: { id: true, name: true, platform: true }, // Fetch fields being updated for comparison
    });

    if (!account) {
      throw new HTTPException(404, {
        message: "Investment account not found or you don't have permission.",
      });
    }

    const updateData: Partial<InferSelectModel<typeof InvestmentAccount>> = {
      updatedAt: new Date(),
    };
    let changed = false;
    if (name !== undefined && name !== account.name) {
      updateData.name = name;
      changed = true;
      // Optionally check for duplicate names again if updating name
      const existingName = await db.query.InvestmentAccount.findFirst({
        where: and(
          eq(InvestmentAccount.name, name),
          eq(InvestmentAccount.userId, userId),
          ne(InvestmentAccount.id, accountId),
        ),
        columns: { id: true },
      });
      if (existingName) {
        throw new HTTPException(409, {
          message: `Another investment account named "${name}" already exists.`,
        });
      }
    }
    if (platform !== undefined && platform !== account.platform) {
      updateData.platform = platform;
      changed = true;
    }

    if (!changed) {
      return { message: 'No changes detected.', id: accountId };
    }

    const result = await db
      .update(InvestmentAccount)
      .set(updateData)
      .where(eq(InvestmentAccount.id, accountId))
      .returning({ id: InvestmentAccount.id })
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Update Error: ${err.message}` });
      });

    if (result.length === 0) {
      throw new HTTPException(500, { message: 'Failed to update investment account.' });
    }

    return { message: 'Investment Account updated successfully', id: accountId };
  }

  async deleteInvestmentAccount(accountId: string, userId: string) {
    // Verify ownership
    const account = await db.query.InvestmentAccount.findFirst({
      where: and(eq(InvestmentAccount.id, accountId), eq(InvestmentAccount.userId, userId)),
      columns: { id: true },
    });

    if (!account) {
      throw new HTTPException(404, {
        message: "Investment account not found or you don't have permission.",
      });
    }

    // Use transaction for atomicity: delete investments first, then the account
    await db.transaction(async (tx) => {
      await tx
        .delete(Investment)
        .where(eq(Investment.account, accountId))
        .catch((err) => {
          tx.rollback();
          throw new HTTPException(500, { message: `DB Delete Investments Error: ${err.message}` });
        });

      await tx
        .delete(InvestmentAccount)
        .where(eq(InvestmentAccount.id, accountId))
        .catch((err) => {
          tx.rollback();
          throw new HTTPException(500, { message: `DB Delete Account Error: ${err.message}` });
        });
    });

    return { message: 'Investment Account and associated investments deleted successfully!' };
  }
}

export const investmentAccountService = new InvestmentAccountService();
