# Expense Tracker - Frontend

> A modern, intuitive web application for tracking your expenses, managing finances, and interacting with an AI assistant. Built with Next.js, React, Tailwind CSS, and Shadcn UI.

## Overview

This is the frontend component of the Expense Tracker application, providing a user-friendly interface for the [Expense Tracker Backend](../backend). It enables users to visually manage accounts, transactions, budgets, goals, investments, debts, and leverage AI for financial tasks.

## Features

### Authentication & User Management

- Secure user registration (with profile picture) and login.
- User profile management (name, email, profile picture, preferred currency, AI API Key management).
- Logout functionality.
- Forgot password and password reset flow.

### Account Management

- Create, view, edit, and delete multiple financial accounts.
- View account lists with balances and analytics previews.
- Detailed account view with transaction history, filtering, sorting, pagination, and date range selection.
- Account sharing with other users (grant/revoke).
- View accounts shared with the user.

### Transaction Management

- Add new income and expense transactions via modal.
- Categorize transactions using a searchable combobox (with inline category creation).
- Set transaction date and time using a date-time picker.
- View transaction list with advanced filtering (search, category, type, date range), sorting, and pagination.
- Edit and delete existing transactions.
- Import transactions from XLSX files (Excel).
- Import transactions from PDF bank statements (using `unpdf` for parsing - basic structure supported).
- Export transactions to XLSX or CSV based on current filters.

### Budgeting & Goals

- Create, view, edit, and delete budgets for specific categories (monthly/yearly).
- View budget summaries comparing actual spending to budgeted amounts for selected periods.
- Track progress for individual budgets (via modal or dashboard).
- Create, view, edit, and delete saving goals (target amount, target date).
- Track progress towards saving goals visually.
- Add/withdraw funds allocated to goals via modal.

### Investment Tracking

- Create, view, edit, and delete investment accounts (brokerages).
- Add, edit, and delete individual investment holdings (stocks).
- View holdings within an investment account with pagination and sorting.
- View investment account summaries (total invested, dividends, value).
- View overall portfolio summary across all investment accounts (on Dashboard).
- Search for stocks (integrated with backend finance API).
- View current stock prices (integrated with backend finance API).
- View historical portfolio value chart (7d, 30d, 90d, 1y, custom range).
- Auto-fetch historical purchase price based on symbol and date (optional).

### Debt Management

- Create, view, edit, and delete debt records (loans taken/given).
- Track principal, premium, interest rate, type (simple/compound), associated account, counterparty.
- Handle duration input via units (days, weeks, months, years + frequency) or custom date range.
- Mark debts as paid.
- Utility for calculating simple/compound interest within the UI.

### Analytics & Dashboard

- **Dashboard:** Customizable presets (Default, Budget Focus, Investment Focus).
  - Financial Health Score estimation card.
  - Financial Snapshot card (Overall Balance, Income, Expense, Percentage Changes).
  - Financial Trend Charts (Line, Bar, Area options) with date range filter.
  - Spending Breakdown chart (Pie, Donut, Column options) with period filter.
  - Budget Progress summary card with period filter.
  - Saving Goal highlights card.
  - Investment Summary card with historical sparkline chart and period filter.
  - Debt Summary card (outstanding debts).
  - Account Balance list summary.
  - Quick Stats card (highest/lowest income/expense).
  - Customizable layout (show/hide sections).
  - Manual refresh option.
- **Account Details:** Specific analytics cards and charts for individual accounts based on selected duration.
- **Statements:** Generate PDF or XLSX statements for accounts (via backend endpoint - triggers download).

### AI Assistant

- **Chat Interface:** Accessible via a floating trigger button on most pages.
- **Natural Language Processing:** Understands requests to add/list/update/delete data (transactions, accounts, etc.) and answer financial questions.
- **Tool Integration:** Interacts with backend tools to perform requested actions securely.
- **Conversation History:** Maintained per session (persisted in backend).
- **Suggested Actions:** Provides contextual buttons for navigation or confirmation based on AI response.
- **API Key Management:** Users can securely add/update/remove their personal AI API key (e.g., Google AI) in their profile.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI Library:** [React](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [Shadcn UI](https://ui.shadcn.com/)
- **State Management/Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/v4)
- **Forms:** [React Hook Form](https://react-hook-form.com/)
- **Schema Validation:** [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/icons/)
- **Charting:** [Recharts](https://recharts.org/en-US/)
- **File Handling:** [XLSX](https://sheetjs.com/) (SheetJS), [unpdf](https://unpdf.unjs.io/) (PDF parsing), [react-dropzone](https://react-dropzone.js.org/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Utilities:** [date-fns](https://date-fns.org/), [jwt-decode](https://www.npmjs.com/package/jwt-decode), [react-hot-toast](https://react-hot-toast.com/), [use-debounce](https://www.npmjs.com/package/use-debounce), [axios](https://axios-http.com/)

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
│   │   ├── (private)/    # Routes requiring authentication (Dashboard, Accounts, etc.)
│   │   ├── (public)/     # Public routes (e.g., /auth/*)
│   │   └── layout.tsx    # Root layout for authenticated routes
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base UI components (Shadcn + custom like numeric-input)
│   │   ├── modals/       # Dialog/Modal components (Add/Edit/Delete/Share/etc.)
│   │   ├── dashboard/    # Dashboard specific components & cards
│   │   ├── layout/       # Sidebar, Header components
│   │   ├── ai/           # AI Chat interface components
│   │   └── ...           # Feature-specific components (account, budget, transaction, etc.)
│   ├── lib/              # Core logic, utilities, API endpoints
│   │   ├── endpoints/    # API request functions (wrappers around apiFetch)
│   │   ├── hooks/        # Custom React hooks (useAuth, useToast, usePagination, etc.)
│   │   ├── utils/        # Utility functions (cn, formatCurrency) & Zod schemas
│   │   └── api-client.ts # Axios instance configuration
│   │   └── auth.ts       # Client-side auth helpers
│   │   └── types.ts      # TypeScript type definitions
│   ├── config/           # Application configuration (e.g., dashboard layouts)
├── public/             # Static assets (images, favicons, sample files)
├── package.json
├── tsconfig.json
└── next.config.ts      # Next.js configuration
```

## Contributing

Please refer to the main project `CONTRIBUTING.md` file (if available) or open an issue/pull request.

## License

This project is licensed under the [MIT License](../LICENSE).

## Browser Support

The application is tested and supported on the following modern browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

For optimal performance and experience, we recommend using the latest version of Chrome or Firefox.

## Performance

The application implements several performance optimizations:

- **Code Splitting:**
  - Next.js App Router automatically handles route-based code splitting.
  - Dynamic imports (`next/dynamic`) used for heavy components like the AI Chat interface and PDF parsing logic.
- **Asset Optimization:**
  - Image optimization using `next/image`.
  - Font optimization via `next/font`.
  - CSS minification and purging via Tailwind CSS.
- **Caching:**
  - Server-side data fetching leverages React Server Components where applicable.
  - Client-side data fetching caching managed by TanStack Query (React Query).
  - Browser caching strategies applied via Next.js defaults.
- **Rendering:**
  - Primarily uses Client Components due to extensive interactivity, but leverages Server Components for layout and static parts where possible.
  - Optimized re-renders using `React.memo`, `useCallback`, and `useMemo`.
  - Skeleton loading states provide better perceived performance.
- **Bundle Size:** Efforts made to keep dependencies minimal. Consider using `@next/bundle-analyzer` for detailed analysis if needed.

## Development Guidelines

### Code Style

- Follow the project's ESLint and Prettier configuration (`bun run format`).
- Use TypeScript for all new code.
- Adhere to React best practices and hooks guidelines.
- Write clear, concise, and meaningful commit messages.

### Component Development

1.  **Structure:**
    - Organize components by feature within the `src/components` directory.
    - Utilize `components/ui` for base, reusable primitives (often from Shadcn).
    - Aim for focused, single-responsibility components.
2.  **State Management:**
    - Use TanStack Query for server state management (fetching, caching, mutations).
    - Use React Context API (`useAuth`) for global UI state like authentication status.
    - Use local component state (`useState`, `useReducer`) for UI-specific logic.
    - Leverage custom hooks (`useAccountDetails`, `useTransactions`, `useUrlState`) to encapsulate complex state logic and data fetching related to specific features or views.
3.  **Forms:**
    - Use React Hook Form for form handling.
    - Use Zod for schema definition and validation (both client-side and aligning with backend).
4.  **Styling:**
    - Primarily use Tailwind CSS utility classes.
    - Utilize `cn` utility for conditional classes.
    - Leverage CSS variables defined in `globals.css` for theme consistency (managed by Shadcn UI and `next-themes`).
5.  **API Interaction:**
    - Define API endpoint functions in `src/lib/endpoints`.
    - Use the configured `apiFetch` utility (based on Axios) in `src/lib/api-client.ts` for consistent request handling, error reporting (via toasts), and authentication header injection.
6.  **Testing:** (Setup Required)
    - Consider adding unit tests (e.g., with Vitest/Jest) for utility functions and complex hooks.
    - Implement integration tests (e.g., with React Testing Library) for key components and user flows.
7.  **Documentation:**
    - Document complex components and hooks with JSDoc comments.
    - Ensure README files are kept up-to-date with features and setup instructions.

### Performance Guidelines

- Memoize expensive computations using `useMemo`.
- Memoize callback functions passed to child components using `useCallback`.
- Wrap components that re-render unnecessarily with `React.memo`.
- Implement proper loading states (e.g., skeletons, spinners) for data fetching.
- Use debouncing (`use-debounce`) for inputs that trigger frequent refetches (like search).
- Analyze component re-renders using React DevTools if performance issues arise.

### Accessibility

- Use semantic HTML elements appropriately.
- Ensure interactive elements are keyboard navigable and focusable.
- Provide appropriate ARIA attributes where necessary.
- Use Shadcn UI components, which generally follow accessibility best practices.
- Test with screen readers periodically if possible.
