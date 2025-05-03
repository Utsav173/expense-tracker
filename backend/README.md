# Expense Tracker Backend

This is the backend service for the Expense Tracker application, built with Bun.js, Hono, Drizzle ORM, and PostgreSQL. It provides a REST API for managing user accounts, transactions, categories, budgets, goals, investments, debts, and AI-driven financial interactions.

## Features

- **User Authentication:** Sign up (with profile picture upload), login, logout, password reset (forgot password flow), JWT-based authentication, profile updates (name, preferred currency, picture), AI API Key management (securely encrypted).
- **Account Management:** CRUD operations, account sharing (grant/revoke access), view balances and transaction history, set default account, multi-currency support (preferred currency per user).
- **Transaction Management:** CRUD operations, categorization, income/expense marking, transfer tracking, recurring transaction support (CRUD, skip next occurrence), bulk import from XLSX, export to XLSX/CSV with filtering.
- **Category Management:** CRUD operations for custom categories, access to predefined categories (seeded).
- **Budgeting:** CRUD operations for category-specific budgets (month/year), budget progress tracking, budget summary views, budget alert notifications (approaching/exceeded).
- **Saving Goals:** CRUD operations, track progress, add/withdraw contributions, goal reminder notifications.
- **Investment Tracking:**
  - Manage investment accounts (brokerages, etc.).
  - Track individual holdings (stocks, shares, purchase info, dividends).
  - Calculate portfolio summaries (total invested, current value, dividends, gain/loss).
  - Calculate historical portfolio value over different periods.
  - Integration with Finance API (e.g., Yahoo Finance) for stock search and live/historical price data.
- **Debt Management:**
  - Track debts (loans, etc., given/taken).
  - Calculate simple/compound interest (utility endpoint).
  - Mark debts as paid.
- **Analytics:**
  - Generate analytics reports for accounts (income, expense, balance, percentage changes over periods).
  - Dashboard summaries (overall balance, income, expense, changes).
  - Category spending breakdown charts.
  - Income vs. expense totals and charts.
- **Data Import/Export:** Import transactions from XLSX, generate account statements (PDF, XLSX), export transactions (XLSX, CSV), provide sample import file.
- **AI Assistant:**
  - Process natural language prompts for financial queries and actions.
  - Use tools to perform CRUD operations on accounts, transactions, categories, budgets, goals, investments, debts based on user requests.
  - Manage conversation history per session.
  - Securely uses user-provided AI API keys (e.g., Google AI).
- **Automated Tasks (Cron Jobs):**
  - Automatically generate transactions based on recurring schedules.
  - Send daily notifications for budget alerts, saving goal reminders, and upcoming bill payments.
- **Security:** Password hashing (bcrypt), JWT authentication, input validation (Zod), ORM query protection (Drizzle), image compression, secure AI API key encryption (AES-GCM).

## Database Data model visualize

The database schema is visualized below. For a more detailed view, you can use Drizzle Studio by running `bun run db:studio`.

![Database Schema](https://raw.githubusercontent.com/Utsav173/expense-tracker/main/backend/public/database-schema.png)

## Technologies Used

- **Bun.js:** Fast JavaScript runtime.
- **Hono:** Web framework for Bun.
- **Drizzle ORM:** TypeScript ORM for SQL.
- **PostgreSQL:** Relational database.
- **@neondatabase/serverless:** Neon serverless driver for PostgreSQL.
- **bcryptjs:** Password hashing.
- **nodemailer:** Sending emails (welcome, forgot password, account sharing, notifications).
- **hono/jwt:** JWT authentication.
- **@ai-sdk/google:** Google AI SDK integration.
- **Sharp:** Image processing (profile picture compression).
- **XLSX (SheetJS):** Reading/writing Excel files.
- **Puppeteer:** PDF generation for statements.
- **date-fns & date-fns-tz:** Date/time manipulation and timezone support.
- **Zod:** Schema validation.
- **node-cron:** Scheduling automated tasks (recurring transactions, notifications).
- **Other Libraries:** `chalk`, `chance`, `cli-progress`, `@supercharge/promise-pool`, etc. (see `package.json`).

## Prerequisites

- **Bun:** Latest version ([https://bun.sh/](https://bun.sh/)).
- **PostgreSQL:** A PostgreSQL database connection string (`DATABASE_URL` env variable). Neon is recommended.
- **Email Provider (Optional but Recommended):** For password reset, sharing, and notification emails (e.g., Gmail with App Password).
- **AI Provider API Key (Optional):** If using the AI Assistant feature (e.g., Google AI API Key).
- **Strong Encryption Secret:** Required for AI API key encryption.

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
    Create a `.env` file in the `backend` directory. Refer to `.env.example` (if available) or add the following:

    ```dotenv
    # Database (Required)
    DATABASE_URL_NEW=postgres://user:password@host:port/database # Your PostgreSQL connection string (Ensure this name matches drizzle.config.ts)

    # JWT (Required - generate a strong, random secret!)
    JWT_SECRET=your_very_long_and_random_secret_key_at_least_32_chars

    # Frontend URLs (Required for email links)
    FRONTEND_URL=http://localhost:3000 # Your frontend base URL
    LOGINPAGE=http://localhost:3000/auth/login # Full URL to login page
    RESETPAGE=http://localhost:3000/auth/reset-password # Full URL to reset password page

    # Email Configuration (Optional - for password reset/sharing/notifications)
    GMAIL_USERNAME=your_email@gmail.com # Your Gmail (or other SMTP) username
    GMAIL_PASS=your_gmail_app_password # Your Gmail App Password (or SMTP password)
    # SMTP_HOST=your_smtp_host # Optional: Custom SMTP
    # SMTP_PORT=your_smtp_port # Optional: Custom SMTP
    # SMTP_USER=your_smtp_user # Optional: Custom SMTP
    # SMTP_PASS=your_smtp_password # Optional: Custom SMTP

    # AI Configuration (Optional - For AI Assistant Feature)
    # User provides their key via frontend profile settings.
    # You NEED to set the encryption secret here.
    AI_API_KEY_ENCRYPTION_SECRET=your_strong_32_byte_secret_for_aes_gcm_encryption # REQUIRED if AI feature is used

    # Node Environment & Port (Optional - Defaults provided)
    NODE_ENV=development # development, production, or test
    PORT=1337
    ```

    **Security Notes:**

    - **NEVER** commit your `.env` file. Add it to `.gitignore`.
    - Use a **strong, unique** `JWT_SECRET` (at least 32 characters).
    - Use a **strong, random 32-byte** `AI_API_KEY_ENCRYPTION_SECRET` if using the AI feature. Keep this secret secure.
    - Use **Gmail App Passwords** if using Gmail, as regular passwords may be blocked.

4.  **Database Setup:**
    - **Migrations:** Create database tables based on `src/database/schema.ts`:
      ```bash
      bun run db:migrate
      ```
    - **Seeding (Optional):** Populate with initial data (default categories, test user with INR accounts, sample transactions, budgets, goals, investments, debts):
      ```bash
      bun run seed
      ```
      _(Use caution when seeding production databases)._

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
      ```bash
      bun run start
      ```
      (Ensure production environment variables are set).

## API Documentation

The API documentation is available via the Postman collection: [`expense-backend-api.collection.json`](./expense-backend-api.collection.json). Import this file into Postman to explore endpoints.

## Scripts

- `dev`: Start development server with hot-reloading.
- `start`: Start production server (requires build).
- `generate:build`: Build the application for production.
- `db:pull`: Pull current DB schema (for drizzle-kit).
- `db:push`: Push schema changes to DB (alternative to migrations, use carefully).
- `db:generate`: Generate Drizzle ORM migration files based on schema changes.
- `db:migrate`: Apply pending database migrations.
- `db:studio`: Open Drizzle Studio GUI.
- `db:check`: Check schema against the database.
- `seed`: Run the database seeding script.
- `format`: Format code using Prettier.

## Important Considerations

- **Error Handling:** Uses Hono's `HTTPException` for standard HTTP errors. Custom errors are caught and returned as 500. Detailed console logging is implemented.
- **Validation:** Input validation is enforced using Zod schemas via `@hono/zod-validator`.
- **Timezones:** Uses `date-fns-tz` for timezone-aware date operations, particularly in cron jobs. Default timezone often set to `Asia/Kolkata` in examples, configure as needed.
- **Security:**
  - Passwords hashed with bcryptjs.
  - JWT for authentication with expiration.
  - Drizzle ORM helps prevent SQL injection.
  - AI API keys are encrypted at rest using AES-GCM with a dedicated secret.
  - Image compression helps mitigate large uploads.
  - Consider adding rate limiting middleware (e.g., `hono/ratelimiter`) for production APIs.
- **Testing:** (Requires Setup) No automated test setup is included in this project structure. Manual testing using Postman is recommended.
- **Deployment:** Ensure `DATABASE_URL_NEW`, `JWT_SECRET`, `FRONTEND_URL`, `LOGINPAGE`, `RESETPAGE`, `AI_API_KEY_ENCRYPTION_SECRET` (if using AI), and email credentials are configured securely in your deployment environment (e.g., Vercel, Render, AWS).

## Contributing

Please refer to the main project `CONTRIBUTING.md` file (if available) or open an issue/pull request.

## Security

The application implements several security measures:

- **Authentication:**
  - JWT-based authentication with secure token handling.
  - Password hashing using bcryptjs.
  - Token expiration.
  - Secure password reset flow via email links.
- **Data Protection:**
  - SQL injection prevention through Drizzle ORM.
  - Input validation using Zod schemas.
  - AI API keys encrypted at rest using AES-GCM and a strong secret key (`AI_API_KEY_ENCRYPTION_SECRET`).
- **API Security:**
  - CORS configuration (currently allows all origins, adjust for production).
  - Request size limits implicitly handled by Hono/Bun defaults (consider explicit limits).
  - Secure headers are recommended for production (HSTS, CSP - not explicitly configured here).
- **Best Practices:**
  - Environment variables for sensitive data (DB URL, JWT secret, encryption secret, email pass).
  - Regular dependency updates are recommended.
  - Error handling attempts to avoid exposing sensitive internal details.

## Troubleshooting

Common issues and their solutions:

1.  **Database Connection Issues:**
    - Ensure `DATABASE_URL_NEW` in your `.env` file is correct and the database is accessible.
    - Check if the database server is running.
    - Verify network connectivity and firewall settings.
2.  **JWT Authentication Problems:**
    - Verify `JWT_SECRET` is set correctly in `.env` and is sufficiently long/complex.
    - Check token expiration if logins fail after some time.
    - Ensure the `Authorization: Bearer <token>` header is sent correctly from the frontend.
3.  **Email Sending Issues:**
    - Verify Gmail App Password (if using Gmail) or SMTP credentials in `.env`.
    - Check SMTP host/port if using custom provider.
    - Ensure the email service provider isn't blocking the requests (check spam folders, account security settings).
4.  **Migration Errors:**
    - Run `bun run db:check` to verify schema against the database.
    - Check for conflicting migration files in the `drizzle` folder.
    - Ensure the database user specified in `DATABASE_URL_NEW` has permissions to create/modify tables.
5.  **AI Assistant Errors:**
    - Ensure `AI_API_KEY_ENCRYPTION_SECRET` is set correctly in the backend `.env` file (32 bytes).
    - Ensure the user has added a valid AI API key (e.g., Google AI) in their profile settings on the frontend.
    - Check the backend console logs for specific errors from the AI SDK or decryption process.
6.  **Cron Job Issues:**
    - Ensure the backend server process is running continuously for cron jobs to trigger.
    - Verify the cron schedule strings and timezone settings in `src/index.ts`.
    - Check backend logs around the scheduled times for execution messages or errors.
7.  **Performance Issues:**
    - Monitor database query performance (consider using `EXPLAIN ANALYZE`).
    - Add database indexes for frequently queried columns (see `src/database/schema.ts` for existing indexes).
    - Review server resource usage (CPU, memory).

For additional help, please open an issue in the repository.
