import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { zValidator } from '@hono/zod-validator';
import { accountSchema } from '../utils/schema.validations';
import { db } from '../database';
import { Account, Analytics, Category, Transaction } from '../database/schema';
import { HTTPException } from 'hono/http-exception';
import { eq, is, isNull, or } from 'drizzle-orm';

const accountRouter = new Hono();

// Relations routes
accountRouter.get('/dashboard', authMiddleware, async (c) => {});
accountRouter.get('/searchTerm', authMiddleware, async (c) => {});
accountRouter.get('/dropdown/user', authMiddleware, async (c) => {});
accountRouter.post('/share', authMiddleware, async (c) => {});
accountRouter.post('/import/transaction', authMiddleware, async (c) => {});
accountRouter.get('/sampleFile/import', authMiddleware, async (c) => {});
accountRouter.get('/get-shares', authMiddleware, async (c) => {});
accountRouter.get('/previous/share/:id', authMiddleware, async (c) => {});
accountRouter.post('/confirm/import/:id', authMiddleware, async (c) => {});
accountRouter.get('/customAnalytics/:id', authMiddleware, async (c) => {});
accountRouter.get('/get/import/:id', authMiddleware, async (c) => {});

// Account routes
accountRouter.get('/', authMiddleware, async (c) => {});
accountRouter.post('/', authMiddleware, async (c) => {});
accountRouter.get(
  '/:id/statement',
  zValidator('json', accountSchema),
  authMiddleware,
  async (c) => {
    const { name, balance } = await c.req.json();
    const userId = await c.get('userId' as any);
    const accountData = await db
      .insert(Account)
      .values({
        name,
        balance,
        owner: userId,
      })
      .returning()
      .catch((err) => {
        throw new HTTPException(500, { message: err.message });
      });

    await db.insert(Analytics).values({
      account: accountData[0].id,
      balance,
      user: userId,
    });

    let categoryData = await db.query.Category.findFirst({
      where(fields, operators) {
        return operators.and(
          eq(fields.name, 'Opening Balance'),
          or(eq(fields.owner, accountData[0].id), isNull(fields.owner))
        );
      },
    });
    if (!categoryData) {
      categoryData = await db
        .insert(Category)
        .values({
          name: 'Opening Balance',
          owner: accountData[0].id,
        })
        .returning()
        .then((data) => data[0])
        .catch((err) => {
          throw new HTTPException(500, { message: err.message });
        });
    }
    await db.insert(Transaction).values({
      amount: balance,
      category: categoryData.id,
      account: accountData[0].id,
      text: 'Opening Balance',
      isIncome: true,
      owner: userId,
      createdBy: userId,
      transfer: 'self',
      updatedBy: userId,
    });
    return c.json({
      message: 'Account created successfully',
      data: accountData[0],
    });
  }
);

accountRouter.get('/:id', authMiddleware, async (c) => {});
accountRouter.put('/:id', authMiddleware, async (c) => {
  const { name, balance } = await c.req.json();
  const accountData = await db
    .update(Account)
    .set({ name, balance })
    .where(eq(Account.id, c.req.param('id')))
    .returning()
    .catch((err) => {
      throw new HTTPException(400, { message: err.message });
    });

  await db
    .update(Analytics)
    .set({ balance })
    .where(eq(Analytics.account, c.req.param('id')));

  return c.json({
    message: 'Account updated successfully',
  });
});
accountRouter.delete('/:id', authMiddleware, async (c) => {
  const accountData = await db
    .delete(Account)
    .where(eq(Account.id, c.req.param('id')))
    .catch((err) => {
      throw new HTTPException(400, { message: err.message });
    });

  await db
    .delete(Analytics)
    .where(eq(Analytics.account, c.req.param('id')))
    .catch((err) => {
      throw new HTTPException(400, { message: err.message });
    });

  return c.json({
    message: 'Account deleted successfully',
  });
});

export default accountRouter;
