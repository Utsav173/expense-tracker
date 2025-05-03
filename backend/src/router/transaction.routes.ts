// src/router/transaction.routes.ts
import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { HTTPException } from 'hono/http-exception';
import { transactionSchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';
import { transactionService } from '../services/transaction.service'; // Import Transaction Service
import { utils, write } from 'xlsx';
import { Chance } from 'chance';
import { getIntervalValue } from '../utils/date.utils';

const chance = new Chance();
const transactionRouter = new Hono();

// GET / - Get a list of transactions (main endpoint)
transactionRouter.get('/', authMiddleware, async (c) => {
  try {
    const {
      accountId,
      duration,
      q,
      isIncome,
      categoryId,
      page = '1',
      pageSize = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = c.req.query();
    // Get userId *only* if accountId is not provided, otherwise service handles filtering by accountId
    const userId = accountId ? undefined : c.get('userId');

    // Basic validation for pagination and sorting
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    if (isNaN(pageNum) || pageNum < 1)
      throw new HTTPException(400, { message: 'Invalid page number.' });
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100)
      throw new HTTPException(400, { message: 'Invalid page size (1-100).' });
    if (sortOrder !== 'asc' && sortOrder !== 'desc')
      throw new HTTPException(400, { message: 'Invalid sort order (asc/desc).' });
    // Service layer should validate sortBy against allowed fields

    const filters = { accountId, userId, duration, q, isIncome, categoryId };
    const result = await transactionService.getTransactions(
      filters,
      pageNum,
      pageSizeNum,
      sortBy,
      sortOrder,
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Transactions Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch transactions.' });
  }
});

// GET /:id - Get a single transaction
transactionRouter.get('/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const transaction = await transactionService.getTransactionById(id, userId);
    return c.json({ transaction }); // Consistent response structure
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Transaction By ID Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch transaction details.' });
  }
});

// POST / - Create a new transaction
transactionRouter.post('/', authMiddleware, zValidator('json', transactionSchema), async (c) => {
  try {
    const payload = await c.req.json();
    const userId = c.get('userId');
    const result = await transactionService.createTransaction(userId, payload);
    c.status(201);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Create Transaction Error:', err);
    throw new HTTPException(500, { message: 'Failed to create transaction.' });
  }
});

// PUT /:id - Update a transaction
transactionRouter.put('/:id', authMiddleware, zValidator('json', transactionSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const payload = await c.req.json();
    const userId = c.get('userId');
    const result = await transactionService.updateTransaction(id, userId, payload);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Transaction Error:', err);
    throw new HTTPException(500, { message: 'Failed to update transaction.' });
  }
});

// DELETE /:id - Delete a transaction
transactionRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const result = await transactionService.deleteTransaction(id, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Transaction Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete transaction.' });
  }
});

// --- Chart and Specific View Routes ---

// GET /by/category/chart - Aggregated data by category
transactionRouter.get('/by/category/chart', authMiddleware, async (c) => {
  try {
    const { duration, accountId } = c.req.query();
    const userId = c.get('userId');
    const data = await transactionService.getCategoryChartData(userId, accountId, duration);
    return c.json(data);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Category Chart Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch category chart data.' });
  }
});

// GET /by/income/expense - Aggregated income/expense totals
transactionRouter.get('/by/income/expense', authMiddleware, async (c) => {
  try {
    const { duration, accountId } = c.req.query();
    const userId = c.get('userId');
    const data = await transactionService.getIncomeExpenseTotals(userId, accountId, duration);
    return c.json(data);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Income/Expense Totals Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch income/expense totals.' });
  }
});

// GET /by/income/expense/chart - Time-series income/expense/balance data
transactionRouter.get('/by/income/expense/chart', authMiddleware, async (c) => {
  try {
    const { duration, accountId } = c.req.query();
    const userId = c.get('userId');
    const data = await transactionService.getIncomeExpenseChartData(userId, accountId, duration);
    return c.json(data);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Income/Expense Chart Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch income/expense chart data.' });
  }
});

// --- Recurring Transaction Routes ---
transactionRouter.get('/recurring', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { page = '1', pageSize = '10' } = c.req.query();
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    if (isNaN(pageNum) || pageNum < 1)
      throw new HTTPException(400, { message: 'Invalid page number.' });
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100)
      throw new HTTPException(400, { message: 'Invalid page size (1-100).' });

    const result = await transactionService.getRecurringTransactions(userId, pageNum, pageSizeNum);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Recurring Transactions Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch recurring transactions.' });
  }
});

transactionRouter.get('/recurring/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const transaction = await transactionService.getRecurringTransactionById(id, userId);
    return c.json({ transaction });
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Recurring Transaction By ID Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch recurring transaction details.' });
  }
});

transactionRouter.put(
  '/recurring/:id',
  authMiddleware,
  zValidator('json', transactionSchema),
  async (c) => {
    try {
      const { id } = c.req.param();
      const payload = await c.req.json();
      const userId = c.get('userId');
      // Ensure recurring flag is handled correctly if not explicitly in payload
      if (payload.recurring === undefined) payload.recurring = true;
      if (!payload.recurring)
        throw new HTTPException(400, {
          message:
            'Cannot update a non-recurring transaction via this endpoint. Use PUT /transactions/:id instead.',
        });

      // Use the general update service method which handles recurring fields
      const result = await transactionService.updateTransaction(id, userId, payload);
      return c.json(result);
    } catch (err: any) {
      if (err instanceof HTTPException) throw err;
      console.error('Update Recurring Transaction Error:', err);
      throw new HTTPException(500, { message: 'Failed to update recurring transaction.' });
    }
  },
);

transactionRouter.delete('/recurring/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('userId');
    // Use the general delete method, service layer handles checks and ensures it's owned by user
    // Note: This deletes the recurring transaction template. It doesn't affect past generated instances.
    const result = await transactionService.deleteTransaction(id, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Recurring Transaction Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete recurring transaction.' });
  }
});

transactionRouter.post('/recurring/:id/skip', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const result = await transactionService.skipNextRecurringOccurrence(id, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Skip Recurring Transaction Error:', err);
    throw new HTTPException(500, { message: 'Failed to skip recurring transaction.' });
  }
});

// --- Fake Data Route (Keep for testing/demo) ---
transactionRouter.get('/fakeData/by', async (c) => {
  const { duration = 'thisMonth', length = '50' } = c.req.query();
  const lengthNum = parseInt(length);
  if (isNaN(lengthNum) || lengthNum <= 0 || lengthNum > 1000) {
    throw new HTTPException(400, { message: 'Invalid length parameter (1-1000).' });
  }

  // Use util to get date range
  const { startDate, endDate } = await getIntervalValue(duration);

  const catIds = [
    'Groceries',
    'Utilities',
    'Rent/Mortgage',
    'Transportation',
    'Healthcare/Medical',
    'Entertainment',
    'Eating Out',
    'Clothing',
    'Education',
    'Gifts/Donations',
    'Travel',
    'Insurance',
    'Home Improvement',
    'Savings',
    'Other',
  ];
  const exportedArray = [];
  let balance = 0; // Track balance to avoid unrealistic scenarios

  for (let index = 0; index < lengthNum; index++) {
    const randomCategory = chance.pickone(catIds);
    const isIncome = chance.bool({ likelihood: 30 });
    let randomAmount: number;

    if (isIncome) {
      randomAmount = chance.integer({ min: 100, max: 10000 });
      balance += randomAmount;
    } else {
      const maxExpense = Math.max(1, balance + 500);
      randomAmount = chance.integer({ min: 1, max: Math.min(5000, maxExpense) });
      balance -= randomAmount;
    }

    // Generate random date within the calculated range
    const randomDate = new Date(
      new Date(startDate).getTime() +
        Math.random() * (new Date(endDate).getTime() - new Date(startDate).getTime()),
    );

    exportedArray.push({
      Text: `${isIncome ? 'Income' : 'Expense'} - ${chance.company()} - ${chance.word()}`,
      Amount: randomAmount,
      Type: isIncome ? 'income' : 'expense',
      Transfer: chance.name(),
      Category: randomCategory,
      Date: randomDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    });
  }

  const ws = utils.json_to_sheet(exportedArray);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Sample_Transactions');
  const excelBuffer = write(wb, { type: 'buffer' });

  c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  c.header('Content-Disposition', 'attachment; filename=sample_transactions.xlsx');
  return c.body(excelBuffer);
});

export default transactionRouter;
