# Expense Tracker Backend

This is the backend service for the Expense Tracker application, built with Bun.js, Hono, Drizzle ORM, and PostgreSQL. It provides a REST API for managing user accounts, transactions, categories, budgets, goals, investments, debts, and AI-driven financial interactions.

## Features

- **User Authentication:** Sign up (with profile picture upload), login, logout, password reset (forgot password flow), JWT-based authentication, profile updates (name, preferred currency, picture), AI API Key management (securely encrypted).
- **Account Management:** CRUD operations, account sharing (grant/revoke access via email notification), view balances and transaction history, set default account, multi-currency support (preferred currency per user).
- **Transaction Management:** CRUD operations, categorization, income/expense marking, transfer tracking, recurring transaction support (CRUD, skip next occurrence via placeholder), bulk import from XLSX, export to XLSX/CSV with filtering.
- **Category Management:** CRUD operations for custom categories, access to predefined categories (seeded).
- **Budgeting:** CRUD operations for category-specific budgets (month/year), budget progress tracking, budget summary views, budget alert notifications (approaching/exceeded via daily cron job).
- **Saving Goals:** CRUD operations, track progress, add/withdraw contributions, goal reminder notifications (via daily cron job).
- **Investment Tracking:**
  - Manage investment accounts (brokerages, etc.).
  - Track individual holdings (stocks, shares, purchase info, dividends).
  - Calculate portfolio summaries (total invested, current value, dividends, gain/loss).
  - Calculate historical portfolio value over different periods (7d, 30d, 90d, 1y, custom).
  - Integration with Finance API (e.g., Yahoo Finance) for stock search and live/historical price data.
- **Debt Management:**
  - Track debts (loans, etc., given/taken).
  - Calculate simple/compound interest (utility endpoint).
  - Mark debts as paid.
- **Analytics:**
  - Generate analytics reports for accounts (income, expense, balance, percentage changes over periods).
  - Dashboard summaries (overall balance, income, expense, changes).
  - Category spending breakdown charts.
  - Income vs. expense totals and charts over time.
- **Data Import/Export:** Import transactions from XLSX, generate account statements (PDF, XLSX), export transactions (XLSX, CSV), provide sample import file.
- **AI Assistant:**
  - Process natural language prompts for financial queries and actions.
  - Use tools to perform CRUD operations on accounts, transactions, categories, budgets, goals, investments, debts based on user requests.
  - Manage conversation history per session.
  - Securely uses user-provided AI API keys (e.g., Google AI).
- **Automated Tasks (Cron Jobs):**
  - **Recurring Transactions:** Automatically generate transactions based on recurring schedules (daily check at 1 AM Asia/Kolkata by default).
  - **Daily Notifications:** Send email notifications for budget alerts, saving goal reminders, and upcoming bill payments (daily check at 8 AM Asia/Kolkata by default).
- **Security:** Password hashing (bcrypt), JWT authentication, input validation (Zod), ORM query protection (Drizzle), image compression (Sharp), secure AI API key encryption (AES-GCM).

## Database Data model visualize

The database schema is visualized below. For a more detailed view, you can use Drizzle Studio by running `bun run db:studio`.

![Database Schema](https://raw.githubusercontent.com/Utsav173/expense-tracker/main/backend/public/database-schema.png)

## Technologies Used

- **Runtime:** [Bun.js](https://bun.sh/) (Fast JavaScript runtime)
- **Framework:** [Hono](https://hono.dev/) (Web framework for Bun)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) (TypeScript ORM for SQL)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Database Driver:** [@neondatabase/serverless](https://github.com/neondatabase/serverless) (Neon serverless driver)
- **Authentication:** [hono/jwt](https://hono.dev/middleware/jwt), [bcryptjs](https://www.npmjs.com/package/bcryptjs) (Password hashing)
- **AI:** [@ai-sdk/google](https://sdk.vercel.ai/) (Google AI SDK), [ai](https://sdk.vercel.ai/) (Vercel AI SDK Core)
- **Validation:** [Zod](https://zod.dev/), [@hono/zod-validator](https://hono.dev/middleware/zod-validator)
- **Scheduling:** [node-cron](https://www.npmjs.com/package/node-cron) (For recurring tasks & notifications)
- **Email:** [Nodemailer](https://nodemailer.com/about/) (For welcome, password reset, sharing, notifications)
- **File Handling:** [XLSX](https://sheetjs.com/) (SheetJS - Excel read/write), [Puppeteer](https://pptr.dev/) (PDF generation for statements)
- **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/) (Profile picture compression)
- **Date/Time:** [date-fns](https://date-fns.org/), [date-fns-tz](https://date-fns.org/v2/docs/Time-Zones), [chrono-node](https://github.com/wanasit/chrono) (Natural language date parsing)
- **Utilities:** [Lodash](https://lodash.com/), [Chalk](https://github.com/chalk/chalk) (Console styling), [Chance](https://chancejs.com/) (Seeding), [cli-progress](https://github.com/npkg/cli-progress) (Seeding progress), [@supercharge/promise-pool](https://github.com/supercharge/promise-pool) (Seeding concurrency)
- **Development:** [TypeScript](https://www.typescriptlang.org/), [Drizzle Kit](https://orm.drizzle.team/kit/overview) (Migrations/DB tooling), [Prettier](https://prettier.io/) (Code formatting), [Docker](https://www.docker.com/) (Local DB setup)

## Prerequisites

- **Bun:** Latest version ([https://bun.sh/](https://bun.sh/)).
- **Docker & Docker Compose:** **Required** for the simplified local database setup script.
- **Email Provider (Optional but Recommended):** For password reset, sharing, and notification emails (e.g., Gmail with App Password).
- **AI Provider API Key (Optional):** Required **by the end-user** via frontend profile settings if using the AI Assistant feature (e.g., Google AI API Key).
- **Strong Encryption Secret:** **Required** in backend `.env` if the AI feature will be used.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Utsav173/expense-tracker.git
    cd expense-tracker/backend
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory. Refer to `.env.example` (if available) or create one with the following structure. The `DATABASE_URL_NEW` will be provided by the setup script in the next step.

    ```dotenv
    # Database (Required - The `db:create` script will provide this URL)
    # Make sure this var name matches drizzle.config.ts and src/config/index.ts
    DATABASE_URL_NEW=

    # JWT (Required - generate a strong, random secret!)
    JWT_SECRET=your_very_long_and_random_secret_key_at_least_32_chars

    # Frontend URLs (Required for email links)
    FRONTEND_URL=http://localhost:3000 # Your frontend base URL
    LOGINPAGE=http://localhost:3000/auth/login # Full URL to login page
    RESETPAGE=http://localhost:3000/auth/reset-password # Full URL to reset password page

    # AI Configuration (REQUIRED only if AI Assistant feature is used)
    # User provides their key via frontend profile settings.
    # You MUST set the encryption secret here if using AI.
    AI_API_KEY_ENCRYPTION_SECRET=your_strong_32_byte_secret_for_aes_gcm_encryption

    # Email Configuration (Optional - for password reset/sharing/notifications)
    GMAIL_USERNAME=your_email@gmail.com # Your Gmail (or other SMTP) username
    GMAIL_PASS=your_gmail_app_password # Your Gmail App Password (or SMTP password)

    # Node Environment & Port (Optional - Defaults provided)
    NODE_ENV=development # development, production, or test
    PORT=1337
    ```

    **Security Notes:**

    - **NEVER** commit your `.env` file.
    - Use a **strong, unique** `JWT_SECRET`.
    - Use a **strong, random 32-byte** `AI_API_KEY_ENCRYPTION_SECRET`.

4.  **Database Setup:**

        **Option 1: Using Docker (Recommended for Local Development)**

        This is the easiest way to get a local PostgreSQL database running.

        a. **Create the Database Container:**
        ```bash
          bun run db:create
          ```
        This command will start a PostgreSQL database in a Docker container, wait for it to be ready, and print the connection URL to your console.

        b. **Update `.env` file:** Copy the URL printed in the console and paste it as the value for `DATABASE_URL_NEW` in your `.env` file.

        c. **Apply Migrations:** Create the database tables based on the schema:
        ```bash

    bun run db:push

    ````

        d. **Seed Data (Optional):**
        ```bash

    bun run seed
    ````

    _(Use caution when seeding production databases. The seed script clears existing data first!)_

        **Option 2: Manual Setup**

        If you prefer to use your own PostgreSQL instance (e.g., from Neon, Supabase, or a local installation not managed by Docker Compose), follow these steps:

        - Ensure your database is running and you have the connection string.
        - Set the `DATABASE_URL_NEW` in your `.env` file to your connection string.
        - Run migrations: `bun run db:push`
        - (Optional) Seed data: `bun run seed`

## Running the Application

- **Development (with hot-reloading):**

  ```bash
  bun run dev
  ```

  (Server typically starts on `http://localhost:1337`)

- **Production:**
  1.  **Build:**
      ```bash
      bun run generate:build
      ```
  2.  **Start:**
      ````bash
      bun run start
      ```      (Ensure production environment variables are set correctly in your hosting environment).
      ````

## API Documentation

The API documentation is available via the Postman collection: [`expense-backend-api.collection.json`](./expense-backend-api.collection.json). Import this file into Postman to explore endpoints.

## Scripts

- `dev`: Start development server with hot-reloading (`bun run --hot src/index.ts`).
- `start`: Start production server (`bun run dist/index.js`, requires build first).
- `generate:build`: Build the application for production (`bun build ./src/index.ts ...`).
- **`db:create`**: Starts a local PostgreSQL database using Docker and prints the connection URL.
- **`db:stop`**: Stops the local PostgreSQL Docker container.
- **`db:clean`**: Stops and removes the local PostgreSQL Docker container and its data volume (irreversible).
- `db:pull`: Pull current DB schema into Drizzle Kit format (`bunx drizzle-kit pull`).
- `db:push`: Push schema changes directly to DB (alternative to migrations, **use with extreme caution**, especially in production) (`bunx drizzle-kit push`).
- `db:generate`: Generate SQL migration files based on schema changes (`bunx drizzle-kit generate`).
- `db:studio`: Open Drizzle Studio GUI to browse data (`bunx drizzle-kit studio`).
- `db:check`: Check schema against the database for discrepancies (`bunx drizzle-kit check`).
- `seed`: Run the database seeding script (`bun run src/database/seed.ts`).
- `format`: Format code using Prettier (`prettier . --write`).

## Important Considerations

- **Error Handling:** Uses Hono's `HTTPException` for standard HTTP errors. Unhandled errors are caught and returned as 500 Internal Server Error. Detailed console logging is implemented.
- **Validation:** Input validation is enforced using Zod schemas via `@hono/zod-validator`.
- **Timezones:** Uses `date-fns-tz` for timezone-aware date operations, particularly in cron jobs (defaulted to `Asia/Kolkata` in `src/index.ts`, configure as needed). Database timestamps generally stored in UTC.
- **Security:**
  - Passwords hashed with bcryptjs.
  - JWT for authentication with expiration.
  - Drizzle ORM helps prevent SQL injection.
  - AI API keys are encrypted at rest using AES-GCM with a dedicated secret (`AI_API_KEY_ENCRYPTION_SECRET`).
  - Image compression (Sharp) helps mitigate large uploads.
  - Consider adding rate limiting middleware (e.g., `hono/ratelimiter`) for production APIs.
- **Finance API:** The `finance.service.ts` currently uses Yahoo Finance via unofficial endpoints. This is subject to change and may break without notice. For production, consider a reliable, paid finance data API.
- **Testing:** (Requires Setup) No automated test setup is included in this project structure. Manual testing using Postman is recommended.
- **Deployment:** Ensure `DATABASE_URL_NEW`, `JWT_SECRET`, `FRONTEND_URL`, `LOGINPAGE`, `RESETPAGE`, `AI_API_KEY_ENCRYPTION_SECRET` (if using AI), and email credentials are configured securely in your deployment environment (e.g., Vercel, Render, AWS). Use the provided `Dockerfile` for containerized deployments.

## Contributing

Please refer to the main project `CONTRIBUTING.md` file (if available) or open an issue/pull request.

## Security Details

The application implements several security measures:

- **Authentication:**
  - JWT-based authentication with secure token handling and expiration.
  - Password hashing using bcryptjs (cost factor 10 in seed script).
  - Secure password reset flow via time-limited, unique email links.
- **Data Protection:**
  - SQL injection prevention through Drizzle ORM's prepared statements.
  - Input validation using Zod schemas on API routes.
  - Sensitive AI API keys provided by users are encrypted at rest using AES-256-GCM and a strong, dedicated secret key (`AI_API_KEY_ENCRYPTION_SECRET`). Decryption only happens server-side when needed.
- **API Security:**
  - CORS configuration allows all origins by default (`hono/cors`); **restrict this in production**.
  - Request size limits implicitly handled by Hono/Bun defaults (consider explicit limits for file uploads).
  - Secure headers (HSTS, CSP, etc.) are recommended for production deployments (not explicitly configured here).
- **Best Practices:**
  - Environment variables for all sensitive data (DB URL, JWT secret, encryption secret, email pass). `.env` file excluded via `.gitignore`.
  - Dependencies are managed via `bun.lock`. Regular updates recommended (`bun update`).
  - Error handling attempts to avoid exposing sensitive internal details in responses, especially in production mode.

## Troubleshooting

Common issues and their solutions:

1.  **Database Connection Issues:**
    - Verify `DATABASE_URL_NEW` in `.env` is correct and accessible from where the backend is running.
    - Check database server status and network/firewall rules.
    - Ensure the database user has necessary permissions (CREATE, SELECT, INSERT, UPDATE, DELETE).
2.  **JWT Authentication Problems:**
    - Confirm `JWT_SECRET` in `.env` is identical on all server instances (if applicable) and sufficiently complex.
    - Check token expiration (`exp` claim, currently set to 1 hour in `user.service.ts`).
    - Ensure the frontend sends `Authorization: Bearer <token>` header correctly.
3.  **Email Sending Issues:**
    - Verify `GMAIL_USERNAME` and `GMAIL_PASS` (App Password for Gmail) or SMTP credentials in `.env`.
    - Check SMTP host/port if using custom provider.
    - Ensure the email provider isn't blocking requests (check spam, security settings, sending limits).
4.  **Migration Errors (`bun run db:push`):**
    - Run `bunx drizzle-kit check` to compare schema against the database.
    - Ensure the `drizzle` folder contains valid migration files. Run `bunx drizzle-kit generate` if schema changes were made without generating migrations.
    - Check database user permissions for DDL operations (ALTER TABLE, CREATE TABLE, etc.).
5.  **AI Assistant Errors:**
    - **Required:** Ensure `AI_API_KEY_ENCRYPTION_SECRET` is correctly set in the backend `.env` file (must be exactly 32 bytes long).
    - Ensure the user has added a valid AI API key (e.g., Google AI) in their profile settings on the frontend.
    - Check backend console logs for specific errors from the AI SDK (`@ai-sdk/google`) or the `crypto.utils.ts` decryption process. Verify the user's key itself is valid with the provider.
6.  **Cron Job Issues (`node-cron`):**
    - Ensure the backend server process runs continuously (e.g., using PM2, Docker restart policies, systemd). Cron jobs only run while the Node process is active.
    - Verify the cron schedule strings and timezone settings in `src/index.ts`.
    - Check backend logs around the scheduled times (1 AM and 8 AM Asia/Kolkata by default) for execution messages or errors from `recurring.service.ts` or `notification.service.ts`.
7.  **Performance Issues:**
    - Monitor database query performance. Use `EXPLAIN ANALYZE` on slow queries.
    - Review existing database indexes in `src/database/schema.ts`. Add new indexes for frequently filtered or joined columns if necessary.
    - Monitor server resource usage (CPU, memory). Bun is generally efficient, but complex queries or high traffic can strain resources.
8.  **File Upload/Import Issues:**
    - Check server request body size limits if large files fail.
    - Ensure XLSX files have the expected headers (`Text`, `Amount`, `Type`, `Transfer`, `Category`, `Date`).
    - Verify permissions if storing temporary files (not currently done, but relevant for other approaches).

For additional help, please open an issue in the repository.
