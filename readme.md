<div align="center">
  <img src="public/favicon.svg" alt="Logo" width="100" height="100">
  <h1>Expense Tracker</h1>
  <p>A modern, AI-powered, open-source expense tracker built to provide a seamless and intuitive financial management experience.</p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-15-black.svg?style=for-the-badge&logo=nextdotjs" alt="Next.js 15">
    <img src="https://img.shields.io/badge/React-19-blue.svg?style=for-the-badge&logo=react" alt="React 19">
    <img src="https://img.shields.io/badge/TypeScript-5-blue.svg?style=for-the-badge&logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC.svg?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS 4">
    <img src="https://img.shields.io/badge/Shadcn_UI-black?style=for-the-badge&logo=shadcnui&logoColor=white" alt="Shadcn UI">
  </div>

  <p>
    <a href="#-features-showcase">Features</a> •
    <a href="#-why-choose-this-project">Why Us?</a> •
    <a href="#-tech-stack--architecture">Tech Stack</a> •
    <a href="#-local-development">Getting Started</a> •
    <a href="#-deployment">Deployment</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

## 🚀 Features Showcase

This application is packed with features designed for comprehensive financial management.

### 👤 User & Account Management

- ✅ **Secure Authentication:** JWT-based login, registration, and password reset flows.
- ✅ **Profile Customization:** Update user details, profile picture, and preferred currency.
- ✅ **Multi-Account Support:** Manage multiple financial accounts seamlessly.
- ✅ **Account Sharing:** Securely share accounts with other users and manage access permissions.

### 💸 Transaction & Data Management

- ✅ **CRUD Operations:** Full support for creating, reading, editing, and deleting transactions.
- ✅ **Advanced Filtering & Sorting:** Easily find transactions with powerful filters (date, category, type, text search) and sorting options.
- ✅ **Data Import/Export:**
  - **Import:** From XLSX templates and PDF bank statements.
  - **Export:** Filtered transaction data to XLSX or CSV.
- ✅ **Categorization:** Smart category management with an intuitive combobox and inline creation.

### 📊 Analytics & Visualization

- ✅ **Interactive Dashboard:** A fully customizable dashboard with widgets for:
  - Financial Snapshot (Income, Expenses, Net Worth)
  - Spending Breakdowns (by category)
  - Budget vs. Actual Tracking
  - Investment & Debt Summaries
  - Account Balance Lists
- ✅ **Rich Charts & Graphs:** Powered by Recharts for clear, beautiful data visualization.
- ✅ **Account-Specific Analytics:** Dive deep into the financial trends of a single account.
- ✅ **Financial Statements:** Generate PDF or XLSX statements on demand.

### 🎯 Financial Planning

- ✅ **Budgeting:** Set monthly or yearly budgets for specific categories and track your progress.
- ✅ **Savings Goals:** Create and manage savings goals, tracking your contributions and progress visually.
- ✅ **Debt Management:** Track loans (taken or given) with details on interest, duration, and payment status.
- ✅ **Investment Tracking:** Monitor investment accounts, individual holdings, and overall portfolio performance.

### 🤖 AI Assistant

- ✅ **Natural Language Commands:** Interact with your finances using plain English. Ask the AI to add transactions, list expenses, or provide financial summaries.
- ✅ **Secure Tool Integration:** The AI securely interacts with the backend API to perform actions on your behalf.
- ✅ **Context-Aware Suggestions:** Receive smart, actionable suggestions based on your conversation.
- ✅ **Personal API Key:** Full user control over their AI provider API key.

---

## 🌟 Why Choose This Project?

- **Modern Tech Stack:** Built with the latest and greatest web technologies like Next.js 15, React 19, and Tailwind CSS 4 for a fast, reliable, and scalable application.
- **Exceptional User Experience:** A huge emphasis has been placed on creating a clean, intuitive, and responsive UI/UX, powered by the elegant Shadcn UI component library.
- **AI-Powered:** Goes beyond simple tracking by integrating a powerful AI assistant to make financial management faster and more accessible.
- **Extensible & Open Source:** The codebase is clean, well-structured, and ready for new features. Contributions are welcome!
- **Data-Driven Insights:** Powerful analytics and visualizations help you understand your financial health at a glance.

---

## 🛠️ Tech Stack & Architecture

This project uses a modern, type-safe, and performant technology stack.

| Category          | Technology                                                                | Role & Purpose                                                                                                 |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Framework**     | [Next.js](https://nextjs.org/) 15 (App Router)                            | Provides the core structure, file-based routing, server-side rendering, and API routes.                        |
| **UI Library**    | [React](https://react.dev/) 19                                            | The foundational library for building the interactive user interface.                                          |
| **Styling**       | [Tailwind CSS](https://tailwindcss.com/) 4                                | A utility-first CSS framework for rapid, custom UI development without leaving your HTML.                      |
| **Components**    | [Shadcn UI](https://ui.shadcn.com/)                                       | A collection of beautifully designed, accessible, and unstyled components that we build upon.                  |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query/v5)                           | Manages all server state: fetching, caching, and updating data with hooks for a seamless developer experience. |
| **Forms**         | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | The standard for building performant, flexible, and type-safe forms with robust validation.                    |
| **Charting**      | [Recharts](https://recharts.org/en-US/)                                   | A composable charting library built on React components for creating beautiful data visualizations.            |
| **Icons**         | [iconify](https://iconify.design/)                                 | A simply beautiful and consistent icon toolkit.                                                                |
| **Utilities**     | `date-fns`, `clsx`, `tailwind-merge`                                      | Best-in-class utilities for date manipulation and robust class name management.                                |

---

## ⚙️ Local Development

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

- [Node.js](https://nodejs.org/en) (v18.17 or higher)
- [Bun](https://bun.sh/) (v1.0 or higher)
- A running instance of the backend API service.

### 2. Clone the Repository

```bash
git clone https://github.com/Utsav173/expense-tracker.git
cd expense-tracker
```

### 3. Install Dependencies

This project uses `bun` for package management.

```bash
bun install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root of the project by copying the example file:

```bash
cp .env.example .env.local
```

Now, open `.env.local` and add the URL for your running backend API:

```dotenv
# .env.local

# URL of your running backend service (Required)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 5. Run the Development Server

```bash
bun dev
```

The application will be available at **http://localhost:3000**.

---

## 🌐 Deployment

The easiest way to deploy this Next.js application is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

- **Connect Your Git Repository:** Import your project into Vercel from your Git provider (GitHub, GitLab, etc.).
- **Configure Environment Variables:** Add the `NEXT_PUBLIC_API_BASE_URL` to your Vercel project's environment variables.
- **Deploy:** Vercel will automatically build and deploy your application.

---

## 🙌 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
