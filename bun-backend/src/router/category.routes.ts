import { Hono } from 'hono';
import authMiddleware from '../middleware';

const categoryRouter = new Hono();

categoryRouter.get('/',authMiddleware, async (c) => {});
categoryRouter.post('/',authMiddleware, async (c) => {});
categoryRouter.delete('/:id',authMiddleware, async (c) => {});
categoryRouter.put('/:id',authMiddleware, async (c) => {});

export default categoryRouter;
