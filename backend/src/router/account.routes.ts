import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { accountSchema } from '../utils/schema.validations';
import { HTTPException } from 'hono/http-exception';
import { BunFile } from 'bun';
import { accountService } from '../services/account.service';

const accountRouter = new Hono();

accountRouter.get('/dashboard', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const dashboardData = await accountService.getDashboardData(userId);
    return c.json(dashboardData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Dashboard Error:', err);
    throw new HTTPException(500, { message: 'Failed to load dashboard data.' });
  }
});

accountRouter.get('/searchTerm', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const searchTerm = c.req.query('q');
    const results = await accountService.searchTransactions(userId, searchTerm);
    return c.json(results);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Search Term Error:', err);
    throw new HTTPException(500, { message: 'Failed to search transactions.' });
  }
});

accountRouter.get('/dropdown/user', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const users = await accountService.getUsersForDropdown(userId);
    return c.json(users);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('User Dropdown Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch users.' });
  }
});

accountRouter.post('/share', authMiddleware, async (c) => {
  try {
    const { accountId, userId: targetUserId } = await c.req.json();
    const ownerId = c.get('userId');
    const result = await accountService.shareAccount(accountId, targetUserId, ownerId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Share Account Error:', err);
    throw new HTTPException(500, { message: 'Failed to share account.' });
  }
});

accountRouter.post('/import/transaction', authMiddleware, async (c) => {
  try {
    const body = await c.req.formData();
    const accountId = body.get('accountId') as string;
    const docFile = body.get('document') as unknown as BunFile;
    const userId = c.get('userId');

    if (!accountId || !docFile) {
      throw new HTTPException(400, { message: 'Account id and document file are required' });
    }

    const result = await accountService.processImportFile(accountId, userId, docFile);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Import Transaction Error:', err);
    throw new HTTPException(500, { message: 'Failed to process import file.' });
  }
});

accountRouter.get('/sampleFile/import', authMiddleware, async (c) => {
  try {
    const fileStream = await accountService.getSampleFileStream();
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', 'attachment; filename=sample_transactions.xlsx');
    return c.body(fileStream);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Sample File Error:', err);
    throw new HTTPException(500, { message: 'Failed to retrieve sample file.' });
  }
});

accountRouter.get('/get-shares', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
    } = c.req.query();
    const result = await accountService.getSharedAccounts(
      userId,
      +page,
      +limit,
      sortBy,
      sortOrder,
      search,
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Shares Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch shared accounts.' });
  }
});

accountRouter.get('/previous/share/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const ownerId = c.get('userId');
    const sharedUsers = await accountService.getPreviousShares(accountId, ownerId);
    return c.json(sharedUsers);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Previous Share Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch previous shares.' });
  }
});

accountRouter.post('/confirm/import/:id', authMiddleware, async (c) => {
  try {
    const importId = c.req.param('id');
    const userId = c.get('userId');
    const result = await accountService.confirmImport(importId, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Confirm Import Error:', err);
    throw new HTTPException(500, { message: 'Failed to confirm data import.' });
  }
});

accountRouter.get('/customAnalytics/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const duration = c.req.query('duration');
    const userId = c.get('userId');

    if (!duration) {
      throw new HTTPException(400, { message: 'Duration query parameter is required.' });
    }

    const analyticsData = await accountService.getCustomAnalytics(accountId, userId, duration);
    return c.json(analyticsData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Custom Analytics Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch custom analytics.' });
  }
});

accountRouter.get('/get/import/:id', authMiddleware, async (c) => {
  try {
    const importId = c.req.param('id');
    const userId = await c.get('userId');
    const importData = await accountService.getImportData(importId, userId);
    return c.json(importData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Import Data Error:', err);
    throw new HTTPException(500, { message: 'Failed to retrieve import data.' });
  }
});

accountRouter.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
    } = c.req.query();

    const result = await accountService.getAccountList(
      userId,
      +page,
      +limit,
      sortBy as any,
      sortOrder,
      search,
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Accounts Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch accounts.' });
  }
});

accountRouter.get('/list', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const accounts = await accountService.getAccountListSimple(userId);
    return c.json(accounts);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Account List Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch account list.' });
  }
});

accountRouter.post('/', authMiddleware, zValidator('json', accountSchema), async (c) => {
  try {
    const { name, balance, currency } = await c.req.json();
    const userId = c.get('userId');
    const result = await accountService.createAccount(userId, name, balance, currency);
    c.status(201);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Create Account Error:', err);
    throw new HTTPException(500, { message: 'Failed to create account.' });
  }
});

accountRouter.post('/revoke-share', authMiddleware, async (c) => {
  try {
    const { accountId, userId: targetUserId } = await c.req.json();
    const ownerId = c.get('userId');

    const result = await accountService.revokeShare(accountId, targetUserId, ownerId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Revoke Share Error:', err);
    throw new HTTPException(500, { message: 'Failed to revoke share.' });
  }
});

accountRouter.get('/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = c.get('userId');

    const accountData = await accountService.getAccountById(accountId, userId);
    return c.json(accountData);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Account By ID Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch account details.' });
  }
});

accountRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const { name, balance, currency } = await c.req.json();
    const userId = c.get('userId');
    const result = await accountService.updateAccount(accountId, userId, name, balance, currency);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Account Error:', err);
    throw new HTTPException(500, { message: 'Failed to update account.' });
  }
});

accountRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = c.get('userId');
    const result = await accountService.deleteAccount(accountId, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Account Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete account.' });
  }
});

accountRouter.get('/:id/statement', authMiddleware, async (c) => {
  try {
    const accountId = c.req.param('id');
    const userId = c.get('userId');
    const { startDate, endDate, numTransactions, exportType = 'pdf' } = c.req.query();

    const result = await accountService.generateStatement(
      accountId,
      userId,
      startDate,
      endDate,
      numTransactions,
      exportType,
    );

    c.header('Content-Type', result.contentType);
    c.header('Content-Disposition', `attachment; filename=${result.filename}`);
    return c.body(result.buffer);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Statement Generation Error:', err);
    throw new HTTPException(500, { message: 'Failed to generate statement.' });
  }
});

export default accountRouter;
