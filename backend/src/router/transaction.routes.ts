import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { HTTPException } from 'hono/http-exception';
import { transactionSchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';
import { transactionService } from '../services/transaction.service';
import { utils, write } from 'xlsx';
import { Chance } from 'chance';
import { getIntervalValue } from '../utils/date.utils';

const chance = new Chance();
const transactionRouter = new Hono();

transactionRouter.get('/export', authMiddleware, async (c) => {
  try {
    const {
      accountId,
      duration,
      q,
      isIncome,
      categoryId,
      format = 'xlsx',
      minAmount,
      maxAmount,
    } = c.req.query();
    const userId = c.get('userId');

    if (format !== 'xlsx' && format !== 'csv') {
      throw new HTTPException(400, { message: "Invalid format specified. Use 'xlsx' or 'csv'." });
    }

    const parsedMinAmount = minAmount ? parseFloat(minAmount) : undefined;
    const parsedMaxAmount = maxAmount ? parseFloat(maxAmount) : undefined;
    if (minAmount && isNaN(parsedMinAmount!))
      throw new HTTPException(400, { message: 'Invalid minAmount.' });
    if (maxAmount && isNaN(parsedMaxAmount!))
      throw new HTTPException(400, { message: 'Invalid maxAmount.' });

    const filters = {
      accountId,
      userId: accountId ? undefined : userId,
      duration,
      q,
      isIncome,
      categoryId,
      minAmount: parsedMinAmount,
      maxAmount: parsedMaxAmount,
    };

    const result = await transactionService.exportTransactions(filters, format as 'xlsx' | 'csv');

    c.header('Content-Type', result.contentType);
    c.header('Content-Disposition', `attachment; filename="${result.filename}"`);

    return c.body(result.data as any);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Export Transactions Error:', err);
    c.status(err.status || 500);
    return c.json({ message: `Failed to export transactions: ${err.message}` });
  }
});

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

    const userId = accountId ? undefined : c.get('userId');

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    if (isNaN(pageNum) || pageNum < 1)
      throw new HTTPException(400, { message: 'Invalid page number.' });
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100)
      throw new HTTPException(400, { message: 'Invalid page size (1-100).' });
    if (sortOrder !== 'asc' && sortOrder !== 'desc')
      throw new HTTPException(400, { message: 'Invalid sort order (asc/desc).' });

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

transactionRouter.get('/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('userId');
    const transaction = await transactionService.getTransactionById(id, userId);
    return c.json({ transaction });
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Transaction By ID Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch transaction details.' });
  }
});

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

      if (payload.recurring === undefined) payload.recurring = true;
      if (!payload.recurring)
        throw new HTTPException(400, {
          message:
            'Cannot update a non-recurring transaction via this endpoint. Use PUT /transactions/:id instead.',
        });

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

transactionRouter.get('/fakeData/by', async (c) => {
  const { duration = 'thisMonth', length = '50' } = c.req.query();
  const lengthNum = parseInt(length);
  if (isNaN(lengthNum) || lengthNum <= 0 || lengthNum > 1000) {
    throw new HTTPException(400, { message: 'Invalid length parameter (1-1000).' });
  }

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
  let balance = 0;

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
      Date: randomDate.toISOString().split('T')[0],
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
