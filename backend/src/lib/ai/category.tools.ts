import { tool } from 'ai';
import { z } from 'zod';
import { categoryService } from '../../services/category.service';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import { Category } from '../../database/schema';
import { db } from '../../database';
import { createToolResponse, resolveCategoryId } from './shared';

export function createCategoryTools(userId: string) {
  return {
    createCategory: tool({
      description: 'Creates a new custom category for classifying transactions.',
      parameters: z.object({
        categoryName: z
          .string()
          .min(1)
          .describe(
            "The name for the new category (e.g., 'Freelance Income', 'Office Lunch'). Example: \"New Category Name\"",
          ),
      }),
      execute: async ({ categoryName }) => {
        try {
          const newCategory = await categoryService.createCategory(userId, categoryName);
          return createToolResponse({
            success: true,
            message: `Category "${newCategory.name}" created.`,
            data: newCategory,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listCategories: tool({
      description: 'Lists all available categories for the user (custom and shared).',
      parameters: z.object({
        searchName: z
          .string()
          .optional()
          .describe(
            'Optional: Filter categories whose name contains this text. Example: "Food" or "Travel"',
          ),
      }),
      execute: async ({ searchName }) => {
        try {
          const result = await categoryService.getCategories(
            userId,
            1,
            500,
            searchName || '',
            'name',
            'asc',
          );
          const message =
            result.categories.length > 0
              ? `Found ${result.categories.length} categories.`
              : 'No categories found.';
          return createToolResponse({ success: true, message: message, data: result.categories });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyCategoryForAction: tool({
      description:
        'Identifies a custom category by name for a potential update or deletion. Fails if transactions are associated with deletion attempt. Requires confirmation.',
      parameters: z.object({
        categoryIdentifier: z
          .string()
          .min(1)
          .describe('The name or ID of the custom category. Example: "Groceries" or "cat_abc123"'),
      }),
      execute: async ({ categoryIdentifier }) => {
        try {
          const resolved = await resolveCategoryId(userId, categoryIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which category do you want to modify or delete?',
              options: resolved.options,
            });

          const category = await db.query.Category.findFirst({
            where: eq(Category.id, resolved.id),
            columns: { name: true },
          });
          const categoryName = category?.name ?? categoryIdentifier;
          const details = `Category: ${categoryName}`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Confirm the action (update name or delete) and provide the ID (${resolved.id})? Deleting is only possible if no transactions use this category.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteCategory: tool({
      description:
        'Deletes a specific custom category AFTER user confirmation, using its exact unique ID. Fails if transactions are associated.',
      parameters: z.object({
        categoryId: z
          .string()
          .describe(
            'The exact unique ID of the category to delete (obtained from identification step). Example: "cat_xyz789"',
          ),
      }),
      execute: async ({ categoryId }) => {
        try {
          const result = await categoryService.deleteCategory(categoryId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateCategoryName: tool({
      description:
        'Updates the name of an existing custom category AFTER user confirmation, using its specific ID.',
      parameters: z.object({
        categoryId: z
          .string()
          .describe(
            'The unique ID of the custom category to rename (obtained from identification step). Example: "cat_xyz789"',
          ),
        newCategoryName: z
          .string()
          .min(1)
          .describe('The desired new name. Example: "New Category Name"'),
      }),
      execute: async ({ categoryId, newCategoryName }) => {
        try {
          await categoryService.updateCategory(categoryId, userId, newCategoryName);
          return createToolResponse({
            success: true,
            message: `Category (ID: ${categoryId}) renamed to "${newCategoryName}".`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),
  };
}
