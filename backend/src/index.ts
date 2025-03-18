import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// routes imports
import userRouter from './router/user.routes';
import accountRouter from './router/account.routes';
import categoryRouter from './router/category.routes';
import transactionRouter from './router/transaction.routes';
import interestRouter from './router/interest.routes';
import budgetRouter from './router/budget.routes';
import goalRouter from './router/goal.routes';
import investmentAccountRouter from './router/investmentAccount.routes';
import investmentRouter from './router/investment.routes';

const app = new Hono();
app.use('*', cors());
app.use(logger());

// <---------------------------------------------- Routes ----------------------------------------------------->
app.route('/auth', userRouter);
app.route('/accounts', accountRouter);
app.route('/interest', interestRouter);
app.route('/transactions', transactionRouter);
app.route('/category', categoryRouter);
app.route('/budget', budgetRouter);
app.route('/goal', goalRouter);
app.route('/investmentAccount', investmentAccountRouter);
app.route('/investment', investmentRouter);

// <---------------------------------------------- Middlewares ----------------------------------------------->
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    c.status(error.status);
    return c.json({ message: error.message, status: error.status });
  } else if (error instanceof Error) {
    c.status(500);
    return c.json({ message: error.message, status: 500 });
  }
  c.status(500);
  return c.json({ message: 'Internal Server Error', status: 500 });
});
app.notFound((c) => c.json({ message: 'Not Found', status: '𐚤' }));

export default {
  port: 1337,
  fetch: app.fetch,
  idleTimeout: 30,
};
