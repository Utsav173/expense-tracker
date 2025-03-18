# Expense Tracker - Frontend

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)](https://your-build-pipeline-url) [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE) [![Version](https://img.shields.io/badge/version-0.1.0-orange.svg?style=flat-square)]()  <!-- Replace with actual badges -->

> A modern, intuitive web application for tracking your expenses and managing your finances.  Built with Next.js, React, and Tailwind CSS.

## Overview

This is the frontend component of the Expense Tracker application.  It provides a user-friendly interface for interacting with the [Expense Tracker Backend](https://github.com/yourusername/expense-tracker/tree/v-bun-feature/backend) (update with your backend repo link).  The application allows users to manage their accounts, transactions, budgets, goals, investments, and debts, all in one place.

## Features

### 🔑 Authentication & User Management

*   **User Accounts:**
    *   ✅ Secure user registration and login.
    *   ✅ User profile management (name, email, profile picture).
    *   ✅ Logout functionality.
    *   ⏳ Forgot password and password reset (Backend Ready, Frontend *in progress*).
    *   ⏳ Social login integration (Backend foundation exists).
* **User Preferences**
    *   ✅ Get user preferred currency.
    *   ⏳ Update preferred currency settings

### 💰 Account Management

*   **Accounts:**
    *   ✅ Create multiple accounts (e.g., Checking, Savings, Credit Card).
    *   ✅ View account list with balances.
    *   ✅ View individual account details.
    *   ⏳ Edit account details (name, currency, starting balance) (*UI/UX Improvements Needed*).
    *   ⏳ Delete accounts (with confirmation).
    *   ✅ Share accounts with other users (*Basic Sharing Implemented*).
      *   ⏳ Improved User Selection for Sharing.
    *   ✅ View previously shared accounts (sharing history).

### 💸 Transaction Management

*   **Transactions:**
    *   ✅ Add new transactions (income and expenses).
    *   ✅ Categorize transactions.
    *   ✅ Set transaction date and time.
    *   ✅ Mark transactions as recurring. (*Partially implemented in backend, basic UI*)
    *   ✅ View, filter, and sort transaction lists.
    *   ✅ Edit existing transactions.
    *   ✅ Delete transactions.
    *   ✅ Import transactions from XLSX files.
    *   ⏳ Group transactions by category/amount/type. (*Partially implemented - needs UI/UX enhancements*)

### 📊 Budgeting & Goals

*   **Budgets:**
    *   ✅ Create budgets for specific categories and time periods (month/year).
    *   ✅ View budget lists.
    *   ⏳ Update budget amounts.
    *   ⏳ Delete budgets.
    *   ⏳ View budget summaries and progress (UI/UX needed).
*   **Saving Goals:**
    *   ✅ Create and name saving goals.
    *   ✅ Set target amounts and (optional) target dates.
    *   ✅ Track progress towards goals.
    *   ✅ Add/withdraw funds from goals.
    *   ✅ Delete goals.

### 📈 Investment Tracking (Partially Implemented)

*   **Investment Accounts:**
    *   ✅ Create and manage investment accounts.
    *   ✅ View investment account summaries.
    *   ⏳ View detailed investment account information.
    *   ⏳ Update investment account details.
    *   ⏳ Delete investment accounts.
*   **Investments:**
    *   ✅ Add/edit/delete individual investments (stocks, etc.).
    *   ⏳ View investment portfolio.
    *   ⏳ Search for stocks by symbol.
    *   ⏳ Get real-time stock prices.

### 🧾 Debt Management (Partially Implemented)

*   **Debts:**
    *   ✅ Create debt records (loans, credit cards).
    *   ✅ View a list of debts.
    *   ✅ Mark debts as paid.
    *   ⏳ Update existing debt details (basic implementation).
    *   ⏳ Calculate simple and compound interest (basic input and calculation).

### 📊 Analytics

*   **Dashboard:**
    *   ✅ Overall financial summary.
    *   ✅ Income, expense, and balance trends.
    *   ✅ Transaction counts by account.
    *   ⏳ Charts and visualizations (in progress).
*   **Account Details:**
    *   ✅ Detailed view of individual account transactions.
    *   ✅ Filtering and searching within transactions.
    *   ✅ Generate account statements.
    *   ✅ Custom analytics with date filters.

## Technology Stack

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) - React framework for server-side rendering and static site generation.
    *   [React](https://react.dev/) - JavaScript library for building user interfaces.
    *   [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework.
    *   [Shadcn UI](https://ui.shadcn.com/) - UI component library.
    *   [TanStack Query (React Query)](https://tanstack.com/query/v4) - Data fetching and caching.
    *   [React Hook Form](https://react-hook-form.com/) - Form handling.
    *   [Zod](https://zod.dev/) - Schema validation.
    *   [Lucide React](https://lucide.dev/icons/) - Icons.
    *   [XLSX](https://sheetjs.com/) - Excel file parsing.
    *   [date-fns](https://date-fns.org/) - Date manipulation.
    *   [jwt-decode](https://www.npmjs.com/package/jwt-decode) - Decode JWT tokens.
    *   [react-hot-toast](https://react-hot-toast.com/) - Toast notifications.
    *   [use-debounce](https://www.npmjs.com/package/use-debounce) - Debouncing hook.
    *  [Recharts](https://recharts.org/en-US/): For Chart representation
*   **Backend:** See the [backend README](https://github.com/yourusername/expense-tracker/tree/v-bun-feature/backend) (replace with your backend repo link).

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/expense-tracker.git
    cd expense-tracker/frontend
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the `frontend` directory and set the following environment variable:

    ```
    NEXT_PUBLIC_API_BASE_URL=http://localhost:1337 # Replace with your backend URL
    ```

    **Important:**  Ensure that your backend server is running and accessible at the configured `NEXT_PUBLIC_API_BASE_URL`.

4.  **Run the development server:**

    ```bash
    bun dev
    ```

5.  **Open in your browser:**
    Visit `http://localhost:3000` (or the port specified by Next.js).

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── (private)/   # Protected routes (require login)
│   │   ├── (public)/    # Public routes (auth, etc.)
│   │   └── ...
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn UI components (extended)
│   │   ├── modals/      # Modal dialogs
│   │   ├── ...          # Feature-specific components
│   ├── lib/
│   │   ├── endpoints/  # API endpoint definitions
│   │   ├── hooks/      # Custom React hooks
│   │   └── utils.ts    # Utility functions
│   ├── ...
├── public/             # Static assets
├── package.json
├── tsconfig.json
└── ...
```

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) (create this file) for details on how to get involved.

## License

This project is licensed under the [MIT License](LICENSE) (create this file).

