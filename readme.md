```markdown
# Expense Tracker: Full-Stack Financial Management

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)](https://your-build-pipeline-url) [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE) [![Version](https://img.shields.io/badge/version-1.0.0-orange.svg?style=flat-square)]() [![Frontend](https://img.shields.io/badge/frontend-Next.js-black.svg?style=flat-square&logo=next.js&logoColor=white)](frontend) [![Backend](https://img.shields.io/badge/backend-Bun.js-black.svg?style=flat-square&logo=bun&logoColor=white)](backend) [![Database](https://img.shields.io/badge/database-PostgreSQL-blue.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> A comprehensive full-stack web application for tracking, managing, and understanding your finances.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

This project provides a robust feature set for personal finance management through a backend API and a frontend UI.

Detailed feature lists can be found in the respective README files:

- **[Backend Features](./backend/README.md)**
- **[Frontend Features](./frontend/README.md)**

**Highlights:**

- Secure user authentication (JWT) and profile management.
- Multi-account and multi-currency support.
- Detailed transaction tracking (income/expense, categorization, recurrence).
- Budget creation and progress monitoring per category.
- Saving goal management and tracking.
- Investment account and holdings tracking (with Yahoo Finance integration for stock data).
- Debt management (loans, interest calculation).
- Data import/export (XLSX transactions, PDF/XLSX statements).
- Interactive dashboard with financial summaries and trend charts.
- Account sharing capabilities.

## Technologies Used

### Frontend

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/v4) (React Query)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Lucide React](https://lucide.dev/icons/)
- [Recharts](https://recharts.org/en-US/)
- [XLSX](https://sheetjs.com/)
- See `frontend/package.json` for full list.

### Backend

- [Bun.js](https://bun.sh/)
- [Hono](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [PostgreSQL](https://www.postgresql.org/)
- [@neondatabase/serverless](https://neon.tech/) (Neon Driver)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [Nodemailer](https://nodemailer.com/about/)
- [jsonwebtoken (JWT)](https://jwt.io/) (via `hono/jwt`)
- [Sharp](https://sharp.pixelplumbing.com/) (Image processing)
- [Puppeteer](https://pptr.dev/) (PDF generation)
- [date-fns](https://date-fns.org/)
- See `backend/package.json` for full list.

## Project Structure
```

expense-tracker/
├── backend/ # Backend API (Bun.js, Hono, Drizzle ORM, PostgreSQL)
├── frontend/ # Frontend application (Next.js, React, Tailwind CSS)
└── README.md # This file

```

## Getting Started

### Prerequisites

*   **Bun:** Install Bun (version >= 1.0 recommended). See [https://bun.sh/](https://bun.sh/).
*   **Node.js:** Required for some frontend tooling (18+ recommended).
*   **PostgreSQL Database:** A PostgreSQL database URL connection string is required (e.g., from Neon, Supabase, or local setup).
*   **Gmail Account (for Email Features):** Requires a Gmail account with an "App Password" enabled for sending welcome/reset emails. See Google's documentation for creating App Passwords.

### 1. Backend Setup

1.  Navigate to the backend directory: `cd backend`
2.  Install dependencies: `bun install`
3.  Create a `.env` file and configure your environment variables (Database URL, JWT Secret, Email Credentials, Frontend URL). See [backend README](./backend/README.md#installation) for required variables.
4.  Run database migrations: `bun run db:migrate`
5.  (Optional but Recommended for Demo) Seed the database: `bun run seed`

### 2. Frontend Setup

1.  Navigate to the frontend directory: `cd ../frontend`
2.  Install dependencies: `bun install`
3.  Create a `.env.local` file and set `NEXT_PUBLIC_API_BASE_URL` to your running backend URL (e.g., `http://localhost:1337`). See [frontend README](./frontend/README.md#getting-started).

## Running the Application

1.  **Start the Backend:** (from the `backend` directory): `bun run dev`
2.  **Start the Frontend:** (from the `frontend` directory): `bun dev`

Access the application in your browser, typically at `http://localhost:3000`.

## API Documentation

The backend API is documented via a Postman collection. See the **[Backend README](./backend/README.md#api-documentation)** for the link to the collection file (`expense-backend-api.collection.json`).

## Deployment

*   **Backend:** Refer to the [backend README](./backend/README.md#running-the-application) for build (`generate:build`) and start (`start`) commands. Ensure all necessary environment variables are set in your deployment environment.
*   **Frontend:** Deploy as a standard Next.js application (e.g., to Vercel, Netlify). Ensure the `NEXT_PUBLIC_API_BASE_URL` environment variable points to your deployed backend URL.

## Contributing

Contributions are welcome! Please refer to the `CONTRIBUTING.md` file (if available) or open an issue/pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
