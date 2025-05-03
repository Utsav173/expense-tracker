import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import authMiddleware from '../middleware';
import { aiService } from '../services/ai.service';

const aiPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  sessionId: z.string().optional().describe('ID of the ongoing conversation session, if any.'),
});

const aiRouter = new Hono();

aiRouter.post('/process', authMiddleware, zValidator('json', aiPromptSchema), async (c) => {
  try {
    const userId = c.get('userId');

    const { prompt, sessionId } = c.req.valid('json');

    const result = await aiService.processPrompt(userId, prompt, sessionId);

    return c.json({
      response: result.response,
      sessionId: result.sessionId,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
    });
  } catch (error: any) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('AI Route Unhandled Error:', error);

    throw new HTTPException(500, { message: `Failed to process AI request.` });
  }
});

export default aiRouter;
