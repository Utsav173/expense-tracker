// src/services/category.service.ts
import { db } from '../database';
import { Category, Transaction } from '../database/schema';
import { SQL, and, asc, count, desc, eq, ilike, InferSelectModel } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export class CategoryService {
  async getCategories(
    userId: string,
    page: number,
    limit: number,
    search: string,
    sortBy: keyof InferSelectModel<typeof Category>,
    sortOrder: 'asc' | 'desc',
  ) {
    // Categories owned by the user OR shared categories (owner is null)
    let whereClause: SQL<unknown> | undefined = eq(Category.owner, userId);

    if (search) {
      whereClause = and(whereClause, ilike(Category.name, `%${search}%`));
    }

    const totalResult = await db
      .select({ count: count() })
      .from(Category)
      .where(whereClause)
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Count Error: ${err.message}` });
      });

    const total = totalResult[0]?.count ?? 0;

    const categories = await db.query.Category.findMany({
      columns: { id: true, name: true, owner: true /* Include owner for debugging/info */ },
      where: whereClause,
      limit: limit,
      offset: limit * (page - 1),
      orderBy: sortOrder === 'desc' ? desc(Category[sortBy]) : asc(Category[sortBy]),
    }).catch((err) => {
      throw new HTTPException(500, { message: `DB Fetch Error: ${err.message}` });
    });

    return {
      categories,
      pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
    };
  }

  async createCategory(userId: string, name: string) {
    // Check if category with the same name already exists for this user
    const existingCategory = await db.query.Category.findFirst({
      where: and(eq(Category.name, name), eq(Category.owner, userId)),
    });

    if (existingCategory) {
      throw new HTTPException(409, { message: `Category "${name}" already exists for this user.` });
    }

    const categoryData = await db
      .insert(Category)
      .values({ name, owner: userId })
      .returning()
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Insert Error: ${err.message}` });
      });

    if (!categoryData || categoryData.length === 0) {
      throw new HTTPException(500, { message: 'Failed to create category record.' });
    }

    return categoryData[0];
  }

  async updateCategory(categoryId: string, userId: string, name: string) {
    // Verify the user owns the category they are trying to update
    const category = await db.query.Category.findFirst({
      where: and(eq(Category.id, categoryId), eq(Category.owner, userId)),
    });

    if (!category) {
      throw new HTTPException(404, {
        message: 'Category not found or you do not have permission to edit it.',
      });
    }

    // Check if another category with the new name already exists for the user
    if (name !== category.name) {
      const existingCategory = await db.query.Category.findFirst({
        where: and(eq(Category.name, name), eq(Category.owner, userId)),
      });
      if (existingCategory) {
        throw new HTTPException(409, {
          message: `Another category named "${name}" already exists.`,
        });
      }
    }

    const result = await db
      .update(Category)
      .set({ name, updatedAt: new Date() }) // Update timestamp
      .where(eq(Category.id, categoryId))
      .returning({ id: Category.id }); // Return ID to confirm update

    if (result.length === 0) {
      throw new HTTPException(500, { message: 'Failed to update category.' });
    }

    return { message: 'Category updated successfully' };
  }

  async deleteCategory(categoryId: string, userId: string) {
    // Verify ownership first
    const category = await db.query.Category.findFirst({
      where: and(eq(Category.id, categoryId), eq(Category.owner, userId)),
    });

    if (!category) {
      throw new HTTPException(404, {
        message: 'Category not found or you do not have permission to delete it.',
      });
    }

    // Check if any transactions are associated with this category *for this user*
    const transactionCountResult = await db
      .select({ count: count() })
      .from(Transaction)
      .where(and(eq(Transaction.category, categoryId), eq(Transaction.owner, userId))) // Ensure transactions belong to the user
      .catch((err) => {
        throw new HTTPException(500, { message: `DB Transaction Check Error: ${err.message}` });
      });

    const transactionCount = transactionCountResult[0]?.count ?? 0;

    if (transactionCount > 0) {
      throw new HTTPException(400, {
        message:
          'Cannot delete category with associated transactions. Please reassign transactions first.',
      });
    }

    // Proceed with deletion
    const deleteResult = await db
      .delete(Category)
      .where(eq(Category.id, categoryId))
      .returning({ id: Category.id }); // Confirm deletion

    if (deleteResult.length === 0) {
      throw new HTTPException(500, { message: 'Failed to delete category.' });
    }

    return { message: 'Category deleted successfully' };
  }
}

export const categoryService = new CategoryService();
