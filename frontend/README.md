# Expense Tracker - Frontend

> A modern, intuitive web application for tracking your expenses, managing finances, and interacting with an AI assistant. Built with Next.js, React, Tailwind CSS, and Shadcn UI.

## Overview

This is the frontend component of the Expense Tracker application, providing a user-friendly interface for the [Expense Tracker Backend](../backend). It enables users to visually manage accounts, transactions, budgets, goals, investments, debts, and leverage AI for financial tasks.

## Features

### Authentication & User Management

- Secure user registration (with profile picture upload) and login.
- User profile management (name, email, profile picture update, preferred currency selection, AI API Key management).
- Logout functionality.
- Forgot password and password reset flow.

### Account Management

- Create, view, edit (name only), and delete multiple financial accounts.
- View account lists with balances and analytics previews (income/expense % change).
- Detailed account view with transaction history, advanced filtering (search, category, type, date range), sorting, pagination.
- Account sharing with other users (grant/revoke access).
- View accounts shared with the user by others.

### Transaction Management

- Add new income and expense transactions via modal with date/time picker.
- Categorize transactions using a searchable combobox (with inline category creation).
- View transaction list within an account with filtering, sorting, pagination.
- Edit transaction details (description, amount, type, category, date, transfer info).
- Delete existing transactions.
- **Import Transactions:**
  - From XLSX files (Excel) using a predefined template.
  - From PDF bank statements (basic parsing support using `unpdf`).
  - Preview and confirm imported data before finalizing.
- **Export Transactions:**
  - Export transactions to XLSX or CSV format.
  - Export based on the currently applied filters (account, date range, type, category, search).

### Budgeting & Goals

- Create, view, edit (amount), and delete budgets for specific categories (monthly/yearly).
- View budget summaries comparing actual spending to budgeted amounts for selected periods (month/year selector).
- Track progress for individual budgets visually.
- Create, view, edit (name, target amount, target date), and delete saving goals.
- Track progress towards saving goals visually (progress bar, remaining amount).
- Add/withdraw funds allocated to goals via modal.

### Investment Tracking

- Create, view, edit (name, platform), and delete investment accounts (brokerages).
- Add, edit (shares, purchase price/date, dividend), and delete individual investment holdings (stocks).
- View holdings within an investment account with pagination and sorting.
- View investment account summaries (total invested, dividends, current value - _requires backend calculation_).
- View overall portfolio summary across all investment accounts (on Dashboard - _requires backend calculation_).
- Search for stocks (integrated with backend finance API via combobox).
- View current stock prices (displayed when selecting symbol - _via backend API_).
- View historical portfolio value chart (7d, 30d, 90d, 1y, custom range options).
- Auto-fetch historical purchase price based on symbol and date (optional feature in Add/Edit Holding modal).

### Debt Management

- Create, view, edit (description, duration/frequency), and delete debt records (loans taken/given).
- Track principal, premium, interest rate, type (simple/compound), associated account, counterparty.
- Handle duration input via units (days, weeks, months, years + frequency) or custom date range picker.
- Mark debts as paid.
- Utility for calculating simple/compound interest (placeholder/coming soon).

### Analytics & Dashboard

- **Dashboard:** Customizable presets (Default, Budget Focus, Investment Focus).
  - Financial Health Score estimation card.
  - Financial Snapshot card (Overall Balance, Income, Expense, Percentage Changes).
  - Financial Trend Charts (Line, Bar, Area options) with date range filter.
  - Spending Breakdown chart (Pie, Donut, Column options) with period filter (Month, Year, All).
  - Budget Progress summary card with period filter (Month/Year).
  - Saving Goal highlights card.
  - Investment Summary card with historical sparkline chart and period filter (7d, 30d, 90d, 1y, custom).
  - Debt Summary card (outstanding debts).
  - Account Balance list summary (Top 5).
  - Quick Stats card (highest/lowest income/expense).
  - Customizable layout (show/hide sections via Options dropdown).
  - Manual refresh option.
- **Account Details:** Specific analytics cards (Balance, Income, Expense, Net) and charts (Trends, Spending Breakdown) for individual accounts based on selected duration.
- **Statements:** Generate PDF or XLSX statements for accounts (triggers download via backend).

### AI Assistant

- **Chat Interface:** Accessible via a floating trigger button on allowed pages.
- **Natural Language Processing:** Understands requests to add/list/update/delete data and answer financial questions.
- **Tool Integration:** Interacts with backend tools securely. Displays tool activity (calls/results) in a collapsible section. Renders structured data from tools (e.g., transaction lists).
- **Conversation History:** Maintained per session (persisted in backend, loaded on open).
- **Suggested Actions:** Provides contextual buttons based on AI response (e.g., navigate to relevant page, confirm/cancel actions).
- **API Key Management:** Users can securely add/update/remove their personal AI API key (e.g., Google AI) in their profile settings. Access to the AI assistant is disabled if no key is configured.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (v15+, App Router)
- **UI Library:** [React](https://react.dev/) (v19+)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4+)
- **Component Library:** [Shadcn UI](https://ui.shadcn.com/) (based on Radix UI)
- **State Management/Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/v5) (v5+)
- **Forms:** [React Hook Form](https://react-hook-form.com/) (v7+)
- **Schema Validation:** [Zod](https://zod.dev/) (v3+)
- **Icons:** [Lucide React](https://lucide.dev/icons/)
- **Charting:** [Recharts](https://recharts.org/en-US/) (v2+)
- **File Handling:**
  - [XLSX](https://sheetjs.com/) (SheetJS - Excel parsing/generation)
  - [unpdf](https://unpdf.unjs.io/) (PDF text extraction for import)
  - [react-dropzone](https://react-dropzone.js.org/) (File uploads)
  - [file-saver](https://github.com/eligrey/FileSaver.js/) (Triggering file downloads)
- **Animation:** [Framer Motion](https://www.framer.com/motion/) (v12+)
- **Utilities:** [date-fns](https://date-fns.org/) (v4+), [jwt-decode](https://www.npmjs.com/package/jwt-decode), [sonner](https://sonner.emilkowalski.com/), [use-debounce](https://www.npmjs.com/package/use-debounce), [axios](https://axios-http.com/), [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge)
- **Theming:** [next-themes](https://github.com/pacocoursey/next-themes)

## Getting Started

1.  **Prerequisites:** Ensure the [Backend Service](../backend) is set up and running. Node.js (18+) and Bun (1+) are required.
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
    _(Uses Next.js Turbopack for faster development builds)._
6.  **Open in your browser:** Visit `http://localhost:3000` (or the port specified).

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router structure
│   │   ├── (private)/    # Routes requiring authentication (Dashboard, Accounts, etc.)
│   │   │   ├── layout.tsx    # Layout for private routes (includes Sidebar)
│   │   │   └── page.tsx      # Default page (usually Account list)
│   │   │   └── ...           # Feature route groups (dashboard, transactions, etc.)
│   │   ├── (public)/     # Public routes (e.g., /auth/*)
│   │   │   └── auth/         # Authentication pages (login, signup, etc.)
│   │   │   └── layout.tsx    # Layout for public auth routes
│   │   └── globals.css   # Global styles & Tailwind directives
│   │   └── layout.tsx    # Root layout (applies providers)
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base UI components (Shadcn + custom like numeric-input)
│   │   ├── modals/       # Dialog/Modal components (Add/Edit/Delete/Share/etc.)
│   │   ├── dashboard/    # Dashboard specific components & cards
│   │   ├── layout/       # Sidebar, Header components
│   │   ├── ai/           # AI Chat interface components
│   │   ├── account/      # Account-specific components (details, transactions)
│   │   ├── budget/       # Budget-specific components
│   │   ├── category/     # Category-specific components
│   │   ├── goal/         # Goal-specific components
│   │   ├── investment/   # Investment-specific components
│   │   ├── debt/         # Debt-specific components
│   │   └── transactions/ # Transaction-specific components (table, import)
│   │   └── date/         # Date/Time picker components
│   ├── lib/              # Core logic, utilities, API endpoints
│   │   ├── endpoints/    # API request functions (wrappers around apiFetch)
│   │   ├── hooks/        # Custom React hooks (useAuth, useToast, etc.)
│   │   ├── utils/        # Utility functions (cn, formatCurrency) & Zod schemas
│   │   ├── api-client.ts # Axios instance configuration & apiFetch utility
│   │   ├── auth.ts       # Client-side auth helpers
│   │   ├── types.ts      # TypeScript type definitions
│   │   └── react-query.ts # TanStack Query client setup
│   ├── config/           # Application configuration (e.g., dashboard layouts)
│   ├── hooks/            # General custom hooks (usePagination, useUrlState, etc.)
├── public/             # Static assets (images, favicons)
├── package.json
├── tsconfig.json
├── next.config.ts      # Next.js configuration
├── postcss.config.mjs  # PostCSS config for Tailwind v4
└── tailwind.config.ts  # Tailwind CSS configuration
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

- **Code Splitting:** Next.js App Router handles route-based code splitting. Dynamic imports (`next/dynamic`) are used for heavy components (AI Chat, Particles).
- **Asset Optimization:** Image optimization (`next/image`), Font optimization (`next/font`), CSS minification/purging (Tailwind).
- **Caching:** TanStack Query manages client-side data fetching caching. Next.js defaults handle browser caching.
- **Rendering:** Primarily Client Components due to interactivity, leveraging Server Components where feasible. Memoization (`React.memo`, `useCallback`, `useMemo`) optimizes re-renders. Skeleton loading states enhance perceived performance.
- **Bundle Size:** Dependencies are managed carefully.

## Development Guidelines

### Code Style

- Follow ESLint/Prettier config (`bun run format`).
- Use TypeScript.
- Adhere to React best practices.
- Write clear commit messages.

### Component Development

- Organize by feature in `src/components`.
- Use `components/ui` for primitives (Shadcn).
- Use TanStack Query for server state, Context/local state for UI state.
- Use custom hooks (`hooks/`, `lib/hooks/`) for encapsulating logic.
- Use React Hook Form + Zod for forms.
- Use Tailwind CSS utilities (+ `cn` helper).
- Define API functions in `lib/endpoints/` using `apiFetch`.

### Performance Guidelines

- Memoize expensive computations/callbacks.
- Use `React.memo` where appropriate.
- Implement loading states (skeletons, spinners).
- Use debouncing (`use-debounce`) for frequent refetches (e.g., search).
- Analyze re-renders with React DevTools if needed.

### Accessibility

- Use semantic HTML.
- Ensure keyboard navigation and focus states.
- Provide ARIA attributes.
- Leverage Shadcn UI's accessibility features.
