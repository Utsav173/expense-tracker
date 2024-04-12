import { Hono } from 'hono';
import authMiddleware from '../middleware';

const transactionRouter = new Hono();

transactionRouter.get('/', authMiddleware, async (c) => {});
transactionRouter.get('/:id', authMiddleware, async (c) => {});
transactionRouter.get('/by/:field', authMiddleware, async (c) => {});
transactionRouter.get('/by/category/chart', authMiddleware, async (c) => {});
transactionRouter.get('/by/income/expense', authMiddleware, async (c) => {});
transactionRouter.get(
  '/by/income/expense/chart',
  authMiddleware,
  async (c) => {}
);
transactionRouter.get('/fakeData/by', async (c) => {});
transactionRouter.post('/', authMiddleware, async (c) => {});
transactionRouter.put('/:id', authMiddleware, async (c) => {});
transactionRouter.delete('/:id', authMiddleware, async (c) => {});

export default transactionRouter;
