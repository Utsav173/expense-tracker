// src/index.ts
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config'; // Import validated config

// Import routers
import userRouter from './router/user.routes';
import accountRouter from './router/account.routes';
import categoryRouter from './router/category.routes';
import transactionRouter from './router/transaction.routes';
import interestRouter from './router/interest.routes';
import budgetRouter from './router/budget.routes';
import goalRouter from './router/goal.routes';
import investmentAccountRouter from './router/investmentAccount.routes';
import investmentRouter from './router/investment.routes';
import aiRouter from './router/ai.routes';
import { StatusCode } from 'hono/utils/http-status';

const app = new Hono();

// Apply CORS and Logger middleware
app.use('*', cors()); // Configure origins specifically for production
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
app.route('/ai', aiRouter);

// <---------------------------------------------- Error Handling ----------------------------------------------->
app.onError((err, c) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof HTTPException) {
    statusCode = err.status;
    message = err.message;
    // Log server errors (5xx) from HTTPException
    if (statusCode >= 500) {
      console.error(
        `HTTPException Error [${c.req.method} ${c.req.url}]: Status ${statusCode}, Message: ${err.message}`,
      );
      // console.error(err.stack); // Optionally log stack for 5xx
    }
  } else if (err instanceof Error) {
    // Log unexpected errors with stack trace
    console.error(`Unhandled Error [${c.req.method} ${c.req.url}]:`, err);
    // Don't expose stack trace to client in production
    if (config.NODE_ENV !== 'production') {
      message = err.message;
    }
  } else {
    console.error(`Unknown Error Type [${c.req.method} ${c.req.url}]:`, err);
    message = 'An unexpected error occurred';
  }

  c.status(statusCode as StatusCode);
  return c.json({
    status: statusCode,
    message: message,
  });
});

// <---------------------------------------------- Not Found Handler -------------------------------------------->
app.notFound((c) => {
  c.status(404);
  return c.json({ message: 'Not Found', status: 404 });
});

// <---------------------------------------------- Server Export ------------------------------------------------>
export default {
  port: config.PORT,
  fetch: app.fetch,
  idleTimeout: 30,
};

console.log(`Server starting on port ${config.PORT} in ${config.NODE_ENV} mode...`);
