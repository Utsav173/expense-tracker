# Expense Tracker Backend

This is the backend service for the Expense Tracker application, built with Bun.js, Hono, Drizzle ORM, and PostgreSQL. It provides a REST API for managing user accounts, transactions, categories, budgets, goals, investments, and debts.

## Features

- **User Authentication:** Sign up, login, logout, password reset (forgot password flow), JWT-based authentication, profile updates (name, currency, picture).
- **Account Management:** CRUD operations, account sharing, view balances and transaction history, set default account, multi-currency support (preferred currency per user).
- **Transaction Management:** CRUD operations, categorization, income/expense marking, recurring transaction support, bulk import from XLSX.
- **Category Management:** CRUD operations for custom categories, access to predefined categories.
- **Budgeting:** CRUD operations for category-specific budgets (month/year), budget progress tracking, and summary views.
- **Saving Goals:** CRUD operations, track progress, add/withdraw contributions.
- **Investment Tracking:** Manage investment accounts, track individual holdings (stocks, shares, purchase info, dividends), calculate portfolio summaries. Integration with Yahoo Finance API for stock search and live price data.
- **Debt Management:** Track debts (loans, etc.), calculate simple/compound interest, mark debts as paid.
- **Analytics:** Generate analytics reports for accounts (income, expense, balance, percentage changes), dashboard summaries, category spending breakdowns, income vs. expense totals and charts.
- **Data Import/Export:** Import transactions from XLSX, generate account statements (PDF, XLSX), provide sample import file.

## Database Data model visualize

![image](public/image.png)

## Technologies Used

- **Bun.js:** Fast JavaScript runtime.
- **Hono:** Web framework for Bun.
- **Drizzle ORM:** TypeScript ORM for SQL.
- **PostgreSQL:** Relational database.
- **@neondatabase/serverless:** Neon serverless driver for PostgreSQL.
- **bcrypt:** Password hashing.
- **nodemailer:** Sending emails (forgot password, account sharing).
- **hono/jwt:** JWT authentication.
- **Sharp:** Image processing (profile picture compression).
- **XLSX:** Reading/writing Excel files.
- **Puppeteer:** PDF generation.
- **date-fns:** Date/time manipulation.
- **Zod:** Schema validation.
- **Other Libraries:** `chalk`, `chance`, `cli-progress`, `@supercharge/promise-pool`, etc. (see `package.json`).

## Prerequisites

- **Bun:** Latest version ([https://bun.sh/](https://bun.sh/)).
- **PostgreSQL:** A PostgreSQL database connection string (`DATABASE_URL` env variable). Neon is recommended.
- **Email Provider (Optional):** For password reset and sharing emails (e.g., Gmail with App Password).

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
    DATABASE_URL=postgres://user:password@host:port/database # Your PostgreSQL connection string

    # JWT (Required - generate a strong, random secret!)
    JWT_SECRET=your_very_long_and_random_secret_key

    # Frontend (Required for email links)
    FRONTEND_URL=http://localhost:3000 # Your frontend URL

    # Email Configuration (Optional - for password reset/sharing)
    GMAIL_USERNAME=your_email@gmail.com # Your Gmail (or other SMTP) username
    GMAIL_PASS=your_gmail_app_password # Your Gmail App Password (or SMTP password)
    # SMTP_HOST=your_smtp_host # Optional: Custom SMTP
    # SMTP_PORT=your_smtp_port # Optional: Custom SMTP
    # SMTP_USER=your_smtp_user # Optional: Custom SMTP
    # SMTP_PASS=your_smtp_password # Optional: Custom SMTP

    # Note: Add other variables as needed (e.g., specific API keys)
    ```

    **Security Notes:**

    - **NEVER** commit your `.env` file. Add it to `.gitignore`.
    - Use a **strong, unique** `JWT_SECRET`.
    - Use **Gmail App Passwords** if using Gmail, as regular passwords may be blocked.

4.  **Database Setup:**
    - **Migrations:** Create database tables:
      ```bash
      bun run db:migrate
      ```
    - **Seeding (Optional):** Populate with initial data (default categories, test user):
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
      `bash
    bun run start
    `
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

- **Error Handling:** Uses Hono's `HTTPException` for standard HTTP errors. Custom errors are caught and returned as 500.
- **Validation:** Input validation is enforced using Zod schemas via `@hono/zod-validator`.
- **Security:**
  - Passwords hashed with bcrypt.
  - JWT for authentication.
  - Drizzle ORM helps prevent SQL injection.
  - Consider adding rate limiting middleware (e.g., `hono/ratelimiter`) for production.
- **Testing:** (Requires Setup) Information on running tests should be added here. Currently, no test setup is detailed in the provided files.
- **Deployment:** Ensure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and other necessary environment variables are configured in your deployment environment (e.g., Vercel, Render, AWS).

## Contributing

Please refer to the main project `CONTRIBUTING.md` file (if available) or open an issue/pull request.
