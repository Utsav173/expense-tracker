# Expense Tracker: Full-Stack Financial Management

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)](https://github.com/Utsav173/expense-tracker/actions) [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE) [![Version](https://img.shields.io/badge/version-1.0.0-orange.svg?style=flat-square)](https://github.com/Utsav173/expense-tracker/releases) [![Frontend](https://img.shields.io/badge/frontend-Next.js-black.svg?style=flat-square&logo=next.js&logoColor=white)](frontend) [![Backend](https://img.shields.io/badge/backend-Bun.js-black.svg?style=flat-square&logo=bun&logoColor=white)](backend) [![Database](https://img.shields.io/badge/database-PostgreSQL-blue.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> A comprehensive full-stack web application for tracking, managing, understanding, and interacting with your finances using an AI assistant.

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
- [Demo](#demo)
- [Contributing](#contributing)
- [License](#license)

## Features

This project provides a robust feature set for personal finance management through a backend API and a modern frontend UI.

Detailed feature lists can be found in the respective README files:

- **[Backend Features](./backend/README.md)**
- **[Frontend Features](./frontend/README.md)**

**Highlights:**

- **Core Finance Management:** Secure user auth, multi-account/currency support, detailed transaction tracking (CRUD, recurring, categorization), budgeting, saving goals, investment tracking (holdings, summary, finance API integration), debt management.
- **Data Handling:** Import transactions (XLSX, PDF bank statement parsing via `unpdf`), Export transactions (XLSX/CSV), Generate account statements (PDF/XLSX).
- **User Interface:** Interactive dashboard (customizable presets, charts, summaries), account sharing, profile management (including AI API key setup).
- **Automation:** Scheduled backend jobs (via `node-cron`) for recurring transactions and email notifications (budget alerts, goal reminders, bill reminders).
- **AI Assistant:** Natural language interaction (via frontend chat) for querying data and performing actions (e.g., "Add a ₹500 expense for groceries", "Show my budget for travel this month"). Securely uses user-provided AI keys (encrypted via AES-GCM on backend).
- **Security:** JWT authentication, bcrypt hashing, input validation (Zod), ORM protection, secure AI key encryption.

## Technologies Used

### Frontend

- **Framework:** [Next.js](https://nextjs.org/) (v15+, App Router)
- **UI:** [React](https://react.dev/) (v19+), [Tailwind CSS](https://tailwindcss.com/) (v4+), [Shadcn UI](https://ui.shadcn.com/)
- **State/Data Fetching:** [TanStack Query](https://tanstack.com/query/v5) (v5+)
- **Forms:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Charting:** [Recharts](https://recharts.org/en-US/)
- **File Parsing:** [XLSX](https://sheetjs.com/), [unpdf](https://unpdf.unjs.io/) (PDF parsing)
- **Other:** [Lucide React](https://lucide.dev/), [date-fns](https://date-fns.org/) (v4+), [axios](https://axios-http.com/), [Framer Motion](https://www.framer.com/motion/)

### Backend

- **Runtime:** [Bun.js](https://bun.sh/)
- **Framework:** [Hono](https://hono.dev/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (tested with Neon)
- **Authentication:** [hono/jwt](https://hono.dev/middleware/jwt), [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **AI:** [@ai-sdk/google](https://sdk.vercel.ai/)
- **Scheduling:** [node-cron](https://www.npmjs.com/package/node-cron)
- **Email:** [Nodemailer](https://nodemailer.com/about/)
- **File Handling:** [XLSX](https://sheetjs.com/), PDF generation handled by `pdf-generator-worker` (using Puppeteer and EJS for templates)
- **Other:** [Zod](https://zod.dev/), [date-fns-tz](https://date-fns.org/v2/docs/Time-Zones), [Sharp](https://sharp.pixelplumbing.com/) (Image processing), [crypto.subtle](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) (for AES-GCM)

## Project Structure

```
expense-tracker/
├── backend/  # Backend API (Bun.js, Hono, Drizzle ORM, PostgreSQL)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── frontend/ # Frontend application (Next.js, React, Tailwind CSS)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── .gitignore
├── LICENSE
└── README.md # This file
```

## Getting Started

### Prerequisites

- **Bun:** Install Bun (version >= 1.0 recommended). See [https://bun.sh/](https://bun.sh/).
- **Node.js:** Required for some frontend tooling (18+ recommended).
- **Docker & Docker Compose:** **Required** for the simplified local database setup.
- **Gmail Account (Optional):** For sending welcome/reset/notification emails (requires App Password).
- **Google AI API Key (Optional):** For using the AI Assistant feature. Users add this via their profile.
- **Encryption Secret:** A strong, 32-byte secret key is **required** in the backend `.env` if the AI feature will be used.

### 1. Backend Setup

1.  Navigate to the backend directory: `cd backend`
2.  Install dependencies: `bun install`
3.  Create a `.env` file from the example or with the following structure (you'll fill in `DATABASE_URL_NEW` in the next step):

    ```dotenv
    # --- REQUIRED ---
    DATABASE_URL_NEW=
    JWT_SECRET="your_super_strong_jwt_secret_at_least_32_chars"
    FRONTEND_URL="http://localhost:3000"
    LOGINPAGE="http://localhost:3000/auth/login"
    RESETPAGE="http://localhost:3000/auth/reset-password"

    # --- REQUIRED IF USING AI ASSISTANT ---
    AI_API_KEY_ENCRYPTION_SECRET="your_random_and_secure_32_byte_encryption_key"

    # --- OPTIONAL: EMAIL ---
    GMAIL_USERNAME="your_email@gmail.com"
    GMAIL_PASS="your_gmail_app_password"
    ```

4.  **Create and start the local database** using Docker. This is the simplest method.

    ```bash
    bun run db:create
    ```

    This script will start a PostgreSQL container and print the connection URL.

5.  **Copy the database URL** from the terminal and paste it into your `.env` file for the `DATABASE_URL_NEW` variable.

6.  Run database migrations to create the tables:
    ```bash
    bun run db:push
    ```
7.  (Optional but Recommended for Demo) Seed the database with sample data:
    ```bash
    bun run seed
    ```
    _Note: The seed script clears existing data. To stop the database container later, run `bun run db:stop`. To remove it completely (including all data), run `bun run db:clean`._

### 2. Frontend Setup

1.  Navigate to the frontend directory: `cd ../frontend`
2.  Install dependencies: `bun install`
3.  Create a `.env.local` file and set `NEXT_PUBLIC_API_BASE_URL` to your running backend URL:
    ```dotenv
    NEXT_PUBLIC_API_BASE_URL=http://localhost:1337
    ```

## Running the Application

1.  **Start the Backend:** (from the `backend` directory): `bun run dev`
2.  **Start the Frontend:** (from the `frontend` directory): `bun dev`

Access the application in your browser, typically at `http://localhost:3000`.

## API Documentation

The backend API is documented via a Postman collection. See the **[Backend README](./backend/README.md#api-documentation)** for the link to the collection file (`expense-backend-api.collection.json`).

**Published Backend Docs:** [View API Documentation on Postman](https://documenter.getpostman.com/view/23794641/2sB2j68A9x)

## Deployment

- **Backend:** Refer to the [backend README](./backend/README.md#running-the-application) for build (`generate:build`) and start (`start`) commands. Ensure all necessary environment variables (`DATABASE_URL_NEW`, `JWT_SECRET`, `AI_API_KEY_ENCRYPTION_SECRET`, `FRONTEND_URL` etc.) are set securely in your deployment environment (e.g., using environment variables in Vercel, Render, Docker secrets). Use the provided `Dockerfile` for containerization.
- **Frontend:** Deploy as a standard Next.js application (e.g., to Vercel, Netlify). Ensure the `NEXT_PUBLIC_API_BASE_URL` environment variable points to your deployed backend URL.

## Demo

A live demo of the application is available at [pro-expense.vercel.app](https://pro-expense.vercel.app/auth/login).

**Demo Credentials:**

- Email: `sampleuser@example.com`
- Password: `Password@123`

_(Note: AI features might require you to add your own Google AI API key in the profile settings on the demo)._

## Contributing

We welcome contributions from the community! To contribute:

1.  Fork the repository
2.  Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3.  Make your changes in the relevant `backend` or `frontend` directory.
4.  Commit your changes (`git commit -m 'Add some amazing feature'`)
5.  Push to the branch (`git push origin feature/amazing-feature`)
6.  Open a Pull Request against the `main` branch of the original repository.

Please ensure your PR:

- Follows the existing code style (run `bun run format` in the relevant directory).
- Includes tests for new features (if applicable - testing setup may be required).
- Updates documentation (READMEs, code comments) as needed.
- Has a clear description of changes.

For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
