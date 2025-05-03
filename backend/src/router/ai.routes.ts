// src/router/ai.routes.ts
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import authMiddleware from '../middleware';
import { aiService } from '../services/ai.service'; // Import the AI service

// Schema for validating the request body
const aiPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  sessionId: z.string().optional().describe('ID of the ongoing conversation session, if any.'),
});

// Create the Hono router instance for AI routes
const aiRouter = new Hono();

// Define the main processing endpoint
aiRouter.post(
  '/process',
  authMiddleware, // Apply authentication middleware
  zValidator('json', aiPromptSchema), // Validate incoming JSON payload
  async (c) => {
    try {
      // Get authenticated user ID from context (set by authMiddleware)
      const userId = c.get('userId');
      // Get validated prompt and optional session ID from the request body
      const { prompt, sessionId } = c.req.valid('json');

      // Delegate processing to the AI service
      const result = await aiService.processPrompt(userId, prompt, sessionId);

      // Return the AI's final text response and the session ID
      // The client can use the sessionId to continue the conversation
      return c.json({
        response: result.text,
        sessionId: result.sessionId,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      });
    } catch (error: any) {
      // Re-throw known HTTP exceptions (e.g., from service layer validation or AI config issues)
      if (error instanceof HTTPException) {
        throw error;
      }
      // Log unexpected errors on the server for debugging
      console.error('AI Route Unhandled Error:', error);
      // Return a generic 500 error to the client
      throw new HTTPException(500, { message: `Failed to process AI request.` });
    }
  },
);

// Export the router
export default aiRouter;
