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

const pdfProcessSchema = z.object({
  documentContent: z.string().min(50, 'Document content is too short to be a valid statement.'),
});

const aiRouter = new Hono();

aiRouter.post('/process', authMiddleware, zValidator('json', aiPromptSchema), async (c) => {
  try {
    const userId = c.get('userId');

    const { prompt, sessionId } = c.req.valid('json');

    const result = await aiService.processPrompt(userId, prompt, sessionId);

    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('AI Route Unhandled Error:', error);

    throw new HTTPException(500, { message: `Failed to process AI request.` });
  }
});

aiRouter.post('/process-pdf', authMiddleware, zValidator('json', pdfProcessSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { documentContent } = c.req.valid('json');
    const result = await aiService.processTransactionPdf(userId, documentContent);
    return c.json(result);
  } catch (error: any) {
    if (error instanceof HTTPException) throw error;
    console.error('AI PDF Processing Route Error:', error);
    throw new HTTPException(500, { message: `Failed to process PDF with AI.` });
  }
});

export default aiRouter;
