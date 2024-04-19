import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { Category } from '../database/schema';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';
import {
  InferInsertModel,
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
} from 'drizzle-orm';
import { categorySchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';

const categoryRouter = new Hono();

categoryRouter.get('/', authMiddleware, async (c) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortOrder = 'desc',
  } = c.req.query();

  const sortBy: keyof InferInsertModel<typeof Category> =
    (c.req.query('sortBy') as any) || 'createdAt';

  const userId = await c.get('userId' as any);

  let whereQuery = or(isNull(Category.owner), eq(Category.owner, userId));

  if (search) {
    whereQuery = and(whereQuery, ilike(Category.name, `%${search}%`));
  }

  const total = await db
    .select({ tot: count(Category.id) })
    .from(Category)
    .where(whereQuery)
    .then((res) => res[0].tot)
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });
  // Find accounts with pagination and sorting
  const categories = await db
    .select({
      id: Category.id,
      name: Category.name,
    })
    .from(Category)
    .where(whereQuery)
    .limit(+limit)
    .offset(+limit * (+page - 1))
    .orderBy(
      sortOrder === 'desc' ? desc(Category[sortBy]) : asc(Category[sortBy])
    )
    .catch((err) => {
      throw new HTTPException(500, { message: err.message });
    });

  return c.json({
    categories,
    pagination: { total, totalPages: Math.ceil(total / +limit), page, limit },
  });
});
categoryRouter.post(
  '/',
  zValidator('json', categorySchema),
  authMiddleware,
  async (c) => {
    const { name } = await c.req.json();
    const userId = await c.get('userId' as any);
    const categoryData = await db
      .insert(Category)
      .values({
        name,
        owner: userId,
      })
      .returning()
      .catch((err) => {
        throw new HTTPException(500, { message: err.message });
      });

    return c.json({
      message: 'Category created successfully',
      data: categoryData[0],
    });
  }
);
categoryRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  await db
    .delete(Category)
    .where(eq(Category.id, id))
    .catch((err) => {
      throw new HTTPException(400, { message: err.message });
    });

  return c.json({ message: 'Category deleted successfully' });
});
categoryRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  const { name } = await c.req.json();

  await db
    .update(Category)
    .set({ name })
    .where(eq(Category.id, id))
    .catch((err) => {
      throw new HTTPException(400, { message: err.message });
    });

  return c.json({ message: 'Category updated successfully' });
});

export default categoryRouter;
