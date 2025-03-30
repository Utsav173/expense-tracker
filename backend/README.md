# Expense Tracker Backend

This is the backend service for the Expense Tracker application, built with Bun.js, Hono, Drizzle ORM, and PostgreSQL. It provides a REST API for managing user accounts, transactions, categories, budgets, goals, investments, and debts.

## Features

*   **User Authentication:**
    *   Sign up, login, logout.
    *   Password reset (forgot password flow).
    *   JWT-based authentication.
    *   Social login (currently disabled, but the foundation exists).
*   **Account Management:**
    *   Create, read, update, and delete user accounts.
    *   Account sharing with other users.
    *   View account balances and transaction history.
    *   Set a default account.
    *   Multi-currency support (with a preferred currency per user).
*   **Transaction Management:**
    *   Create, read, update, and delete transactions.
    *   Categorize transactions.
    *   Mark transactions as income or expense.
    *   Import transactions from XLSX files.
    *   Support for recurring transactions.
*   **Category Management:**
    *   Create, read, update, and delete custom transaction categories.
    *   Predefined categories for common expenses.
*   **Budgeting:**
    *   Create, read, update, and delete budgets for specific categories and time periods (month/year).
    *   Track budget progress and view summaries.
*   **Saving Goals:**
    *   Create, read, update, and delete saving goals.
    *   Track progress towards goals.
*   **Investment Tracking:**
    *   Manage investment accounts (e.g., brokerage accounts).
    *   Track individual investments (stocks, etc.) with purchase price, shares, and dividends.
    *   Calculate investment portfolio performance.
    *   Integrate with Yahoo Finance API for stock data (search and price).  *This is a key feature. Make sure it's working reliably!*
*   **Debt Management:**
    *   Track debts (loans, credit cards, etc.).
    *   Calculate interest (simple and compound).
    *   Mark debts as paid.
*   **Analytics:**
    *   Generate analytics reports for accounts, including income, expenses, and balance.
    *   Calculate percentage changes in income and expenses.
*   **Data Import/Export:**
    *   Import transactions from XLSX files.
    *   Generate account statements (PDF, XLSX).

##  Database Data model visulize

![image](public/image.png)

## Technologies Used

*   **Bun.js:** A fast all-in-one JavaScript runtime.
*   **Hono:** A small, fast, and flexible web framework for Bun.
*   **Drizzle ORM:** A TypeScript ORM for SQL databases.
*   **PostgreSQL:**  The relational database.
*   **@neondatabase/serverless:**  Neon serverless driver for PostgreSQL.
*   **bcrypt:**  For password hashing.
*   **nodemailer:** For sending emails (forgot password, account sharing).
*   **jsonwebtoken (JWT):** For user authentication and authorization.
*   **sharp:** For image processing (profile picture compression).
*   **xlsx:** For reading and writing Excel files.
*   **puppeteer:**  For PDF generation.
*   **date-fns:**  For date and time manipulation.
*   **zod:**  For schema validation.
*   **Other Libraries:**  `chalk`, `chance`, `cli-progress`, `@supercharge/promise-pool`, etc. (see `package.json` for the full list).

## Prerequisites

*   **Bun:** Install the latest version of Bun ([https://bun.sh/](https://bun.sh/)).
*   **PostgreSQL:**  You'll need a PostgreSQL database.  You're using Neon (serverless), so you'll need a Neon account and database set up.  *Provide clear instructions for users on how to set this up, or link to your setup guide.*
    * **DATABASE_URL:** You'll need the connection string for your PostgreSQL database, stored in the `DATABASE_URL` environment variable.

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

    Create a `.env` file in the `backend` directory and add the following variables.  *Replace the placeholders with your actual values:*

    ```
    DATABASE_URL=postgres://user:password@host:port/database  # Your Neon database connection string.

    # Email Configuration (for forgot password and account sharing)
    GMAIL_USERNAME=your_email@gmail.com      # Your Gmail address (or other SMTP provider)
    GMAIL_PASS=your_gmail_app_password    # Your Gmail app password (or SMTP password)

    # JWT Secret (should be a long, random string)
    JWT_SECRET=your_very_long_and_random_secret_key

    # Frontend URL (for password reset links, etc.)
    FRONTEND_URL=http://localhost:3000   # Or your frontend's deployment URL.

    # Optional: for using your custom SMTP server:
    SMTP_HOST=your_smtp_host
    SMTP_PORT=your_smtp_port
    SMTP_USER=your_smtp_user
    SMTP_PASS=your_smtp_password

    # Optional: Other environment variables, such as those for Yahoo Finance API.

    ```

    **Important Security Notes:**
    *   **`.env` file:**  *Never* commit your `.env` file to version control.  It contains sensitive credentials.  Add `.env` to your `.gitignore` file.
    *   **`JWT_SECRET`:**  This *must* be a strong, randomly generated secret.  It's crucial for the security of your application.  Do *not* use the example value above in production.
    * **Gmail App Passwords:**  If using Gmail, you'll likely need to generate an "App Password" in your Google account settings, as Google often blocks login attempts from unfamiliar applications.

4.  **Database Setup:**

    *   **Migrations:** Run database migrations to create the necessary tables:
        ```bash
        bun run db:migrate
        ```

    *   **Seeding (Optional):**  You have a `seed.ts` file.  You can run this to populate the database with initial data (like default categories and a test user):
        ```bash
        bun run seed
        ```
        *Be very careful with seeding in production.*

## Running the Application

*   **Development:**

    ```bash
    bun run dev
    ```

    This will start the development server, typically on `http://localhost:1337`.

*   **Production:**

    1.  **Build:**
        ```bash
        bun run generate:build
        ```
    2.  **Start:**
        ```bash
        bun run start
        ```

    *Make sure you have your environment variables (especially `DATABASE_URL` and `NODE_ENV`) set correctly in your production environment.*

## API Documentation

The API documentation is available in a Postman collection: [`expense-backend-api.collection.json`](./expense-backend-api.collection.json).  You can import this file into Postman to explore the API endpoints.


## Scripts

*   `dev`: Starts the development server with hot reloading.
*   `start`: Starts the production server (after building).
*   `generate:build`: Builds the application for production.
*   `db:pull`: Pull the current database schema for local development.
*   `db:push`: Push schema for create tables and schema inside postgres database.
*   `db:generate`: Generates the Drizzle ORM schema files.
*   `db:migrate`: Runs database migrations.
*   `db:studio`: Opens the Drizzle Studio GUI for database management.
*   `db:check`: Checks the database schema for errors.
*   `seed`: Seeds the database with initial data.
*   `format`: Formats the code using Prettier.

## Important Considerations

*   **Error Handling:** The API includes error handling, returning appropriate HTTP status codes and error messages.  *Expand on this.  What are the common error codes, and what do they mean?*
*   **Validation:**  Input validation is performed using Zod schemas. *Consider adding examples of common validation errors.*
*   **Security:**
    *   **Password Hashing:**  Passwords are hashed using bcrypt.
    *   **JWT Authentication:**  JSON Web Tokens are used for authentication. *Mention token expiration and refresh mechanisms if you have them.*
    *   **Input Sanitization:** Sanitize all user inputs to prevent XSS and SQL injection attacks.  *Drizzle helps with SQL injection, but you should explicitly mention XSS prevention strategies.*
    * **Rate Limiting:**  Implement rate limiting to prevent abuse (e.g., brute-force login attempts).  *Hono has middleware for this.*
*   **Testing:**  *Add information about testing.  Do you have unit tests, integration tests, or end-to-end tests?  How can users run them?*
*   **Deployment:** *Provide instructions or links to documentation on how to deploy the backend to a production environment (e.g., Vercel, Render, AWS, etc.).  Include any specific configuration steps.*

## Contributing

*Describe how others can contribute to your project.  Include information about:*

*   Forking and cloning the repository.
*   Creating feature branches.
*   Submitting pull requests.
*   Coding style guidelines.
*   Issue reporting.
