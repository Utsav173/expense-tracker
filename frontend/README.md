# Expense Tracker - Frontend

> A modern, intuitive web application for tracking your expenses and managing your finances. Built with Next.js, React, Tailwind CSS, and Shadcn UI.

## Overview

This is the frontend component of the Expense Tracker application, providing a user-friendly interface for the [Expense Tracker Backend](../backend). It enables users to manage accounts, transactions, budgets, goals, investments, and debts visually.

## Features

### Authentication & User Management

- Secure user registration and login.
- User profile management (name, email, profile picture, preferred currency).
- Logout functionality.
- Forgot password and password reset flow.

### Account Management

- Create, view, and manage multiple financial accounts.
- View account lists with balances and basic analytics.
- Detailed account view with transaction history and filtering.
- Account sharing with other users.
- View accounts shared with the user.

### Transaction Management

- Add new income and expense transactions.
- Categorize transactions using predefined or custom categories.
- Set transaction date and time.
- Support for basic recurring transaction viewing (creation/editing UI may be basic).
- Filter, sort, and search transaction lists within accounts.
- Edit and delete existing transactions.
- Import transactions from XLSX files (Excel and PDF statement parsing supported).

### Budgeting & Goals

- Create and view budgets for specific categories (monthly/yearly).
- View budget summaries comparing actual spending to budgeted amounts.
- Track progress for individual budgets.
- Create, view, and manage saving goals (target amount, target date).
- Track progress towards saving goals.
- Add/withdraw funds allocated to goals.

### Investment Tracking

- Create and manage investment accounts (brokerages).
- Add, edit, and delete individual investment holdings (stocks).
- View holdings within an investment account.
- View investment account summaries (total invested, dividends, value).
- View overall portfolio summary across all investment accounts.
- Search for stocks (via Yahoo Finance API).
- View current stock prices (via Yahoo Finance API).
- View historical portfolio value chart (30d).

### Debt Management

- Create and view debt records (loans taken/given).
- Track principal, interest rate, type (simple/compound), due dates.
- Mark debts as paid.
- Update basic debt details.
- Utility for calculating simple/compound interest.

### Analytics & Dashboard

- **Dashboard:** Customizable presets (Default, Budget Focus, Investment Focus).
  - Overall financial snapshot (balance, income, expense).
  - Financial health score estimation.
  - Income vs. Expense trend charts (Line, Bar, Area options).
  - Spending breakdown pie chart by category.
  - Budget progress summary for the selected period.
  - Saving goal highlights.
  - Investment portfolio summary card with sparkline.
  - Debt summary card.
  - Account balance list summary.
  - Quick stats (highest/lowest income/expense).
  - Configurable time range filters (including custom dates).
  - Manual refresh and layout customization options.
- **Account Details:** Specific analytics for individual accounts based on selected duration.
- **Statements:** Generate PDF or XLSX statements for accounts based on date range or number of transactions.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **UI Library:** [React](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [Shadcn UI](https://ui.shadcn.com/)
- **State Management/Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/v4)
- **Forms:** [React Hook Form](https://react-hook-form.com/)
- **Schema Validation:** [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/icons/)
- **Charting:** [Recharts](https://recharts.org/en-US/)
- **File Handling:** [XLSX](https://sheetjs.com/) (SheetJS), [unpdf](https://unpdf.unjs.io/) (PDF parsing)
- **Utilities:** [date-fns](https://date-fns.org/), [jwt-decode](https://www.npmjs.com/package/jwt-decode), [react-hot-toast](https://react-hot-toast.com/), [use-debounce](https://www.npmjs.com/package/use-debounce)

## Getting Started

1.  **Prerequisites:** Ensure the [Backend Service](../backend) is set up and running.
2.  **Clone the repository:**
    ```bash
    # If you haven't already cloned the main project
    git clone https://github.com/Utsav173/expense-tracker.git
    cd expense-tracker/frontend
    ```
3.  **Install dependencies:**
    ```bash
    bun install
    ```
4.  **Configure Environment Variables:**
    Create a `.env.local` file in the `frontend` directory:
    ```dotenv
    # URL of your running backend service (Required)
    NEXT_PUBLIC_API_BASE_URL=http://localhost:1337
    ```
5.  **Run the development server:**
    ```bash
    bun dev
    ```
6.  **Open in your browser:** Visit `http://localhost:3000` (or the port specified).

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router structure
│   │   ├── (private)/    # Routes requiring authentication
│   │   ├── (public)/     # Public routes (e.g., /auth)
│   │   └── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base UI components (Shadcn + custom)
│   │   ├── modals/       # Dialog/Modal components
│   │   ├── dashboard/    # Dashboard specific components
│   │   └── ...           # Feature-specific components (account, budget, etc.)
│   ├── lib/              # Core logic, utilities, API endpoints
│   │   ├── endpoints/    # API request functions
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions & schemas
│   │   └── ...           # Auth, types, API client config
│   ├── config/           # Application configuration (e.g., dashboard layouts)
├── public/             # Static assets (images, favicons)
├── package.json
├── tsconfig.json
└── next.config.ts      # Next.js configuration
```

## Contributing

Please refer to the main project `CONTRIBUTING.md` file (if available) or open an issue/pull request.

## License

This project is licensed under the [MIT License](../LICENSE).

## Browser Support

The application is tested and supported on the following browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

For optimal performance and experience, we recommend using the latest version of Chrome or Firefox.

## Performance

The application implements several performance optimizations:

- **Code Splitting:**

  - Dynamic imports for heavy components
  - Route-based code splitting
  - Lazy loading of non-critical resources

- **Asset Optimization:**

  - Image optimization using Next.js Image component
  - Font optimization and subsetting
  - CSS minification and purging

- **Caching:**

  - Service Worker for offline support
  - Browser caching strategies
  - API response caching with TanStack Query

- **Rendering:**
  - Static Site Generation (SSG) where possible
  - Incremental Static Regeneration (ISR)
  - Client-side hydration optimization

## Development Guidelines

### Code Style

- Follow the project's ESLint and Prettier configuration
- Use TypeScript for all new code
- Follow React best practices and hooks guidelines
- Write meaningful commit messages

### Component Development

1. **Structure:**

   - Place components in appropriate feature directories
   - Use atomic design principles
   - Keep components focused and single-responsibility

2. **State Management:**

   - Use React Query for server state
   - Use React Context for global UI state
   - Use local state for component-specific state

3. **Testing:**

   - Write unit tests for utilities and hooks
   - Write integration tests for complex components
   - Use React Testing Library for component tests

4. **Documentation:**
   - Document complex components with JSDoc
   - Add usage examples in component stories
   - Keep README files up to date

### Performance Guidelines

- Use React.memo for expensive components
- Implement proper loading states
- Optimize re-renders with useMemo and useCallback
- Monitor bundle size with @next/bundle-analyzer

### Accessibility

- Follow WCAG 2.1 guidelines
- Use semantic HTML elements
- Ensure proper keyboard navigation
- Test with screen readers
