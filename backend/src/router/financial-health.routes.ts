import { Hono } from 'hono';

import { aiService } from '../services/ai.service';
import authMiddleware from '../middleware';

const financialHealthRoutes = new Hono();

financialHealthRoutes.get('/analysis', authMiddleware, async (c) => {
  const userId = await c.get('userId');
  const analysis = await aiService.getFinancialHealthAnalysis(userId);
  return c.json(analysis);
});

export default financialHealthRoutes;
