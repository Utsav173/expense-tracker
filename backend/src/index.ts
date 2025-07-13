import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config';
import cron from 'node-cron';

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
import invitationRouter from './router/invitation.routes';
import emailRouter from './router/email.routes';
import { StatusCode } from 'hono/utils/http-status';

// --- Import Services for Cron ---
import contactRouter from './router/contact.routes';
// -------------------------------

const app = new Hono();

// Apply CORS and Logger middleware
app.use('*', cors());
app.use(logger());

// <---------------------------------------------- Routes ----------------------------------------------------->
app.route('/auth', userRouter);
app.route('/contact', contactRouter);
app.route('/accounts', accountRouter);
app.route('/interest', interestRouter);
app.route('/transactions', transactionRouter);
app.route('/category', categoryRouter);
app.route('/budget', budgetRouter);
app.route('/goal', goalRouter);
app.route('/investmentAccount', investmentAccountRouter);
app.route('/investment', investmentRouter);
app.route('/ai', aiRouter);
app.route('/invite', invitationRouter);
app.route('/email', emailRouter);

// <---------------------------------------------- Error Handling ----------------------------------------------->
app.onError((err, c) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof HTTPException) {
    statusCode = err.status;
    message = err.message;
    if (statusCode >= 500) {
      console.error(
        `HTTPException Error [${c.req.method} ${c.req.url}]: Status ${statusCode}, Message: ${err.message}`,
      );
    }
  } else if (err instanceof Error) {
    console.error(`Unhandled Error [${c.req.method} ${c.req.url}]:`, err);
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

// // <---------------------------------------------- Disable Scheduled Jobs not needed ---------------------------------------------->
// if (config.NODE_ENV !== 'test') {
//   console.log('Setting up scheduled jobs...');

//   // Recurring Transactions (Run daily at 1 AM server time - adjust cron string as needed)
//   // Cron syntax: second minute hour day-of-month month day-of-week
//   cron.schedule(
//     '0 1 * * *',
//     async () => {
//       // Use cron.schedule
//       console.log(`[${new Date().toISOString()}] Running Recurring Transactions Job...`);
//       try {
//         await recurringTransactionService.generateDueTransactions();
//       } catch (error) {
//         console.error(`[${new Date().toISOString()}] Error in Recurring Transactions Job:`, error);
//       }
//     },
//     {
//       scheduled: true,
//       timezone: 'Asia/Kolkata', // Example: Set your server's timezone
//     },
//   );

//   // Notifications (Run daily at 8 AM server time)
//   cron.schedule(
//     '0 8 * * *',
//     async () => {
//       // Use cron.schedule
//       console.log(`[${new Date().toISOString()}] Running Daily Notifications Job...`);
//       try {
//         await notificationService.checkBudgetAlerts();
//         await notificationService.checkGoalReminders();
//         await notificationService.checkBillReminders();
//       } catch (error) {
//         console.error(`[${new Date().toISOString()}] Error in Daily Notifications Job:`, error);
//       }
//     },
//     {
//       scheduled: true,
//       timezone: 'Asia/Kolkata', // Example: Set your server's timezone
//     },
//   );

//   console.log('Scheduled jobs configured.');
// } else {
//   console.log('Skipping scheduled jobs setup in test environment.');
// }
// // -------------------------------------------------------------------------------------------------------------

// <---------------------------------------------- Server Export ------------------------------------------------>
export default {
  port: config.PORT,
  fetch: app.fetch,
  idleTimeout: 30,
};

console.log(`Server starting on port ${config.PORT} in ${config.NODE_ENV} mode...`);
