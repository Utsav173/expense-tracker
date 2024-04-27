import { Hono } from 'hono';
import authMiddleware from '../middleware'; // Import authentication middleware
import { Category } from '../database/schema'; // Import Category model from schema
import { db } from '../database'; // Import database connection
import { HTTPException } from 'hono/http-exception'; // Import HTTPException for error handling
import { InferInsertModel, and, asc, count, desc, eq, ilike, isNull, or } from 'drizzle-orm'; // Import query builder functions from drizzle-orm
import { categorySchema } from '../utils/schema.validations'; // Import category schema for validation
import { zValidator } from '@hono/zod-validator'; // Import Zod validator for request validation

// Create a new Hono instance for the category router
const categoryRouter = new Hono();

// GET / - Get a list of categories with pagination and search
categoryRouter.get('/', authMiddleware, async (c) => {
  // 1. Extract pagination, search, and sorting parameters from the request query
  const { page = 1, limit = 10, search = '', sortOrder = 'desc' } = c.req.query();

  // 2. Determine the sorting field based on the 'sortBy' query parameter
  const sortBy: keyof InferInsertModel<typeof Category> =
    (c.req.query('sortBy') as any) || 'createdAt';

  // 3. Get the authenticated user's ID
  const userId = await c.get('userId' as any);

  // 4. Build the WHERE clause for filtering categories
  let whereQuery = or(isNull(Category.owner), eq(Category.owner, userId)); // Include categories with no owner or owned by the current user
  if (search) {
    whereQuery = and(whereQuery, ilike(Category.name, `%${search}%`)); // Add search condition if a search term is provided
  }

  // 5. Get the total number of categories for pagination
  const total = await db
    .select({ tot: count(Category.id) }) // Count the number of categories
    .from(Category)
    .where(whereQuery) // Apply filtering conditions
    .then((res) => res[0].tot) // Extract the count value
    .catch((err) => {
      // Handle errors and throw HTTPException
      throw new HTTPException(500, { message: err.message });
    });

  // 6. Query the database for categories with pagination and sorting
  const categories = await db
    .select({
      id: Category.id,
      name: Category.name,
    })
    .from(Category)
    .where(whereQuery) // Apply filtering conditions
    .limit(+limit) // Limit the number of results
    .offset(+limit * (+page - 1)) // Calculate offset for pagination
    .orderBy(
      sortOrder === 'desc' ? desc(Category[sortBy]) : asc(Category[sortBy]), // Apply sorting based on sortOrder and sortBy
    )
    .catch((err) => {
      // Handle errors and throw HTTPException
      throw new HTTPException(500, { message: err.message });
    });

  // 7. Return the categories and pagination data as JSON response
  return c.json({
    categories,
    pagination: { total, totalPages: Math.ceil(total / +limit), page, limit },
  });
});

// POST / - Create a new category
categoryRouter.post(
  '/',
  zValidator('json', categorySchema), // Validate the request body using Zod validator and category schema
  authMiddleware,
  async (c) => {
    // 1. Extract the category name from the request body
    const { name } = await c.req.json();

    // 2. Get the authenticated user's ID
    const userId = await c.get('userId' as any);

    // 3. Insert the new category into the database
    const categoryData = await db
      .insert(Category)
      .values({
        name,
        owner: userId, // Associate the category with the current user
      })
      .returning() // Return the newly created category data
      .catch((err) => {
        // Handle errors and throw HTTPException
        throw new HTTPException(500, { message: err.message });
      });

    // 4. Return a success message and the created category data as JSON response
    return c.json({
      message: 'Category created successfully',
      data: categoryData[0],
    });
  },
);

// DELETE /:id - Delete a category by ID
categoryRouter.delete('/:id', authMiddleware, async (c) => {
  // 1. Get the category ID from the request parameters
  const id = c.req.param('id');

  // 2. Delete the category from the database
  await db
    .delete(Category)
    .where(eq(Category.id, id)) // Specify the condition for deletion
    .catch((err) => {
      // Handle errors and throw HTTPException
      throw new HTTPException(400, { message: err.message });
    });

  // 3. Return a success message as JSON response
  return c.json({ message: 'Category deleted successfully' });
});

// PUT /:id - Update a category by ID
categoryRouter.put('/:id', authMiddleware, async (c) => {
  // 1. Get the category ID from the request parameters
  const id = c.req.param('id');

  // 2. Extract the updated category name from the request body
  const { name } = await c.req.json();

  // 3. Update the category in the database
  await db
    .update(Category)
    .set({ name }) // Set the new name for the category
    .where(eq(Category.id, id)) // Specify the condition for the update
    .catch((err) => {
      // Handle errors and throw HTTPException
      throw new HTTPException(400, { message: err.message });
    });

  // 4. Return a success message as JSON response
  return c.json({ message: 'Category updated successfully' });
});

export default categoryRouter; // Export the category router
