import { Category } from './../database/schema';
import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';
import { InferInsertModel, SQL, and, asc, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { categorySchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';

const categoryRouter = new Hono();

categoryRouter.get('/', authMiddleware, async (c) => {
  const { page = 1, limit = 10, search = '', sortOrder = 'desc' } = c.req.query();
  const sortBy: keyof InferInsertModel<typeof Category> =
    (c.req.query('sortBy') as any) || 'createdAt';
  const userId = await c.get('userId' as any);

  let whereQuery = or(isNull(Category.owner), eq(Category.owner, userId));

  if (search && search.length > 0) {
    whereQuery = and(whereQuery, ilike(Category.name, `%${search}%`))!;
  }

  try {
    const total = await db
      .select({ tot: count(Category.id) })
      .from(Category)
      .where(whereQuery)
      .then((res) => res[0].tot);

    const categories = await db
      .select({
        id: Category.id,
        name: Category.name,
      })
      .from(Category)
      .where(whereQuery)
      .limit(+limit)
      .offset(+limit * (+page - 1))
      .orderBy(sortOrder === 'desc' ? desc(Category[sortBy]) : asc(Category[sortBy]));

    return c.json({
      categories,
      pagination: { total, totalPages: Math.ceil(total / +limit), page: +page, limit: +limit },
    });
  } catch (err) {
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});

categoryRouter.post('/', authMiddleware, zValidator('json', categorySchema), async (c) => {
  try {
    const { name } = await c.req.json();
    const userId = await c.get('userId' as any);
    console.log("🚀 ~ categoryRouter.post ~ userId:", userId)
    const categoryData = await db
      .insert(Category)
      .values({
        name,
        owner: userId,
      })
      .returning();

    return c.json({
      message: 'Category created successfully',
      data: categoryData[0],
    });
  } catch (err) {
    throw new HTTPException(500, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});

categoryRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await db.delete(Category).where(eq(Category.id, id));
    return c.json({ message: 'Category deleted successfully' });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});

categoryRouter.put('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { name } = await c.req.json();

    await db.update(Category).set({ name }).where(eq(Category.id, id));
    return c.json({ message: 'Category updated successfully' });
  } catch (err) {
    throw new HTTPException(400, {
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
});

export default categoryRouter;
