import { Hono } from 'hono';
import authMiddleware from '../middleware';
import { HTTPException } from 'hono/http-exception';
import { InferSelectModel } from 'drizzle-orm';
import { categorySchema } from '../utils/schema.validations';
import { zValidator } from '@hono/zod-validator';
import { categoryService } from '../services/category.service';
import { Category } from '../database/schema';

const categoryRouter = new Hono();

categoryRouter.get('/', authMiddleware, async (c) => {
  try {
    const { page = '1', limit = '10', search = '', sortOrder = 'desc' } = c.req.query();
    const sortBy =
      (c.req.query('sortBy') as keyof InferSelectModel<typeof Category>) || 'createdAt';
    const userId = await c.get('userId');

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1)
      throw new HTTPException(400, { message: 'Invalid page number.' });
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100)
      throw new HTTPException(400, { message: 'Invalid limit value (1-100).' });
    if (sortOrder !== 'asc' && sortOrder !== 'desc')
      throw new HTTPException(400, { message: 'Invalid sort order (asc/desc).' });

    const result = await categoryService.getCategories(
      userId,
      pageNum,
      limitNum,
      search,
      sortBy as keyof InferSelectModel<typeof Category>,
      sortOrder,
    );
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Get Categories Error:', err);
    throw new HTTPException(500, { message: 'Failed to fetch categories.' });
  }
});

categoryRouter.post('/', authMiddleware, zValidator('json', categorySchema), async (c) => {
  try {
    const { name } = await c.req.json();
    const userId = await c.get('userId');
    const newCategory = await categoryService.createCategory(userId, name);
    c.status(201);
    return c.json({
      message: 'Category created successfully',
      data: newCategory,
    });
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Create Category Error:', err);
    throw new HTTPException(500, { message: 'Failed to create category.' });
  }
});

categoryRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = await c.get('userId');
    const result = await categoryService.deleteCategory(id, userId);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Delete Category Error:', err);
    throw new HTTPException(500, { message: 'Failed to delete category.' });
  }
});

categoryRouter.put('/:id', authMiddleware, zValidator('json', categorySchema), async (c) => {
  try {
    const id = c.req.param('id');
    const { name } = await c.req.json();
    const userId = await c.get('userId');
    const result = await categoryService.updateCategory(id, userId, name);
    return c.json(result);
  } catch (err: any) {
    if (err instanceof HTTPException) throw err;
    console.error('Update Category Error:', err);
    throw new HTTPException(500, { message: 'Failed to update category.' });
  }
});

export default categoryRouter;
