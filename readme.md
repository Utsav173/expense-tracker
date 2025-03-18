# Expense Tracker: Full-Stack Financial Management

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)](https://your-build-pipeline-url) [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE) [![Version](https://img.shields.io/badge/version-0.1.0-orange.svg?style=flat-square)]()  [![Frontend](https://img.shields.io/badge/frontend-Next.js-black.svg?style=flat-square&logo=next.js&logoColor=white)](frontend) [![Backend](https://img.shields.io/badge/backend-Bun.js-black.svg?style=flat-square&logo=bun&logoColor=white)](backend) [![Database](https://img.shields.io/badge/database-PostgreSQL-blue.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/) <!-- Add more badges as needed -->

<!-- Optional: Add a large, visually appealing banner image here.  It should be placed in the `public` folder of your frontend, and the path adjusted accordingly.
<img src="frontend/public/banner.png" alt="Expense Tracker Banner" width="100%">
-->

> **Track, manage, and understand your finances with ease.** This full-stack web application provides a comprehensive solution for personal expense tracking, budgeting, goal setting, and basic investment and debt management.

## Table of Contents

*   [Features](#features)
*   [Technologies Used](#technologies-used)
*   [Project Structure](#project-structure)
*   [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Backend Setup](#1-backend-setup)
    *   [Frontend Setup](#2-frontend-setup)
    *   [API Documentation Setup](#3-api-documentation-setup)
*   [Running the Application](#running-the-application)
*   [API Documentation](#api-documentation)
*   [Deployment](#deployment)
*   [Contributing](#contributing)
*   [License](#license)

## Features

This project is divided into a backend API and a frontend user interface.  Detailed feature lists, including implementation status (✅ Done, ⏳ In Progress, ❌ Not Implemented), can be found in the respective README files:

*   **[Backend Features](./backend/README.md)**
*   **[Frontend Features](./frontend/README.md)**

**Highlights:**

*   User authentication and authorization.
*   Account creation and management (multiple accounts, different currencies).
*   Transaction tracking (income and expenses).
*   Categorization of transactions.
*   Budget creation and monitoring.
*   Saving goals.
*   Investment account tracking.
*   Debt management.
*   Data import/export (XLSX/PDF).
*   Interactive dashboards and visualizations.
*   API Documentation Generator.

## Technologies Used

### Frontend

*   [Next.js](https://nextjs.org/)
*   [React](https://react.dev/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Shadcn UI](https://ui.shadcn.com/)
*   [TanStack Query](https://tanstack.com/query/v4) (React Query)
*   [React Hook Form](https://react-hook-form.com/)
*   [Zod](https://zod.dev/)
*   [Lucide React](https://lucide.dev/icons/)
*   [Recharts](https://recharts.org/en-US/)
*   [XLSX](https://sheetjs.com/)
* And more (see `frontend/package.json`)

### Backend

*   [Bun.js](https://bun.sh/)
*   [Hono](https://hono.dev/)
*   [Drizzle ORM](https://orm.drizzle.team/)
*   [PostgreSQL](https://www.postgresql.org/)
*   [@neondatabase/serverless](https://neon.tech/)
*   [bcrypt](https://www.npmjs.com/package/bcrypt)
*   [Nodemailer](https://nodemailer.com/about/)
*   [jsonwebtoken (JWT)](https://jwt.io/)
* And more (see `backend/package.json`)

### API Documentation

*  Next.js
*  React
*  Tailwind CSS
*  Postman (for defining the API collection)

## Project Structure

```
expense-tracker/
├── backend/               # Backend API (Bun.js, Hono, Drizzle ORM, PostgreSQL)
├── frontend/              # Frontend application (Next.js, React, Tailwind CSS)
├── api-docs/              # API documentation generator (Next.js)
└── README.md              # This file
```

## Getting Started

### Prerequisites

*   **Bun:**  Install Bun (version >= 1.0 recommended).  See [https://bun.sh/](https://bun.sh/) for installation instructions.
*   **Node.js and npm/yarn/pnpm:** While Bun is the primary runtime, you'll still need Node.js for some tooling (especially in the frontend).  Install a recent LTS version (18+ recommended).
*   **PostgreSQL Database:** You'll need a PostgreSQL database.  The project is configured to use Neon (a serverless PostgreSQL provider), but you can adapt it to other PostgreSQL instances.  You'll need a database URL connection string.
* **Gmail Account**: Create a new account and enable less secure apps on google account.

### 1. Backend Setup

1.  Navigate to the backend directory: `cd backend`
2.  Install dependencies: `bun install`
3.  Create a `.env` file and configure your environment variables (see [backend README](./backend/README.md) for details).
4.  Run database migrations: `bun run db:migrate`
5.  (Optional) Seed the database: `bun run seed`
6.  Start the backend server: `bun run dev`

### 2. Frontend Setup

1.  Navigate to the frontend directory: `cd ../frontend`
2.  Install dependencies: `bun install`
3.  Create a `.env.local` file and configure `NEXT_PUBLIC_API_BASE_URL` (see [frontend README](./frontend/README.md) for details).
4.  Run the frontend development server: `bun dev`

### 3. API Documentation Setup

1. Navigate to the documentation directory: `cd ../api-docs`.
2. Install dependencies: `bun install`
3. Run the Next.js App `bun dev`.
4. Configure the Postman file link in `page.tsx`

## Running the Application

1.  **Start the Backend:** (from the `backend` directory): `bun run dev`
2.  **Start the Frontend:** (from the `frontend` directory): `bun dev`
3.  **Start the API Documentation:** (from the `api-docs` directory): `bun dev`

Access the application in your browser at `http://localhost:3000`.

## API Documentation

Detailed API documentation, generated from a Postman collection, is available. You can either:
*   **Run Documentation Locally**: Run api-docs Next.js App to generate Api documentation and node.js SDK.
*   **Import Postman Collection:** Import the `expense-backend-api.collection.json` file (located in the `backend` directory) into Postman.

## Deployment

*   **Backend:**  Refer to the [backend README](./backend/README.md) for deployment instructions.
*   **Frontend:**  Refer to the [frontend README](./frontend/README.md) for deployment instructions.  The frontend is a standard Next.js application and can be deployed to platforms like Vercel, Netlify, or AWS Amplify.
*  **API Docs:** Refer to the [API Docs README](./api-docs/README.md)

## Contributing

Contributions are welcome!  Please submit issues and pull requests to the repository.  *(Create a `CONTRIBUTING.md` file with detailed guidelines.)*

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. *(Create a `LICENSE` file with the MIT License text.)*
