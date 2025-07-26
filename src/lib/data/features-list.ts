import {
  Users,
  Target,
  Scale,
  TrendingUp,
  Lock,
  ArrowLeftRight,
  Filter,
  FileDown,
  Tag
} from 'lucide-react';

export interface FeatureDetails {
  slug: string;
  icon: React.ElementType;
  title: string;
  description: string;
  longDescription: string;
}

export const featuresList: FeatureDetails[] = [
  {
    slug: 'secure-authentication',
    icon: Lock,
    title: 'Secure Authentication',
    description: 'JWT-based login, registration, and password reset flows.',
    longDescription: `
## Your Security is Our Priority

At Expense Pro, we understand that financial data is among your most sensitive information. That's why we've built our authentication system on a foundation of modern, robust security principles to ensure your account is always protected. Our entire authentication flow is designed to be both highly secure and user-friendly, giving you peace of mind from the moment you sign up.

We utilize **JSON Web Tokens (JWT)** for session management, an industry-standard method for securely transmitting information between parties. When you log in, our server creates a signed token that is stored securely as an HttpOnly cookie. This token is sent with every subsequent request to verify your identity, preventing unauthorized access to your data. The token has a built-in expiration, adding another layer of security by automatically logging you out after a period of inactivity.

### Key Security Features:

*   **Password Hashing:** We never store your password in plain text. All passwords are put through a strong, one-way hashing algorithm (bcrypt) before being stored in our database. This means that even in the extremely unlikely event of a database breach, your password remains unreadable and secure.
*   **Secure Password Reset:** Our password reset process is designed to be just as secure. When you request a reset, a unique, time-sensitive token is generated and sent to your registered email address. This token can only be used once and expires quickly, preventing unauthorized password changes.
*   **HTTPS Everywhere:** All communication between your browser and our servers is encrypted using TLS (Transport Layer Security), the successor to SSL. This ensures that all data, including your login credentials and financial information, is scrambled and protected from eavesdropping during transit.
*   **Input Validation:** We rigorously validate all user inputs on both the client and server sides to protect against common web vulnerabilities like Cross-Site Scripting (XSS) and SQL injection.

By implementing these comprehensive security measures, Expense Pro provides a trusted environment where you can manage your finances with confidence, knowing that your personal and financial information is safeguarded by bank-grade security protocols.
    `
  },
  {
    slug: 'account-sharing',
    icon: Users,
    title: 'Account Sharing',
    description: 'Securely share accounts with other users and manage permissions.',
    longDescription: `
## Collaborate on Your Finances, Securely

Managing finances isn't always a solo activity. Whether you're handling a household budget with a partner, tracking shared expenses with roommates, or providing visibility to a financial advisor, Expense Pro's Account Sharing feature makes collaboration simple, secure, and transparent. It's designed to give you the benefits of shared financial management without compromising the privacy of your personal accounts.

The process is built on a secure invitation system. As the account owner, you have complete control. You can invite another Expense Pro user to access a specific account via their email address. They will receive a notification, and upon acceptance, the shared account will appear in their dashboard, distinctly separate from their own private accounts. This ensures there is no commingling of personal and shared financial data.

### Key Aspects of Account Sharing:

*   **Granular Control:** You are always in the driver's seat. When you share an account, you can decide the level of access the other person has. Initially, shared users have view-only access, allowing them to see all transactions and balances. Future updates will introduce more granular permissions, such as the ability to add or edit transactions.
*   **Privacy First:** Sharing is on an account-by-account basis. Inviting someone to your "Joint Household" account does not give them access to your "Personal Savings" or "Business Expenses" accounts. Your individual financial life remains completely private.
*   **Real-Time Updates:** All members of a shared account see the same real-time information. When one person adds a new transaction for groceries, everyone else with access sees the updated balance and transaction list instantly. This eliminates the need for manual reconciliations and endless "who paid for what" conversations.
*   **Revoke Access Anytime:** Your financial situation can change, and so can your sharing needs. As the owner, you can revoke a user's access to a shared account at any time with a single click. Their access is immediately terminated, ensuring your data remains secure.

Account Sharing is perfect for couples managing joint finances, families teaching children about budgeting, or small business partners tracking shared project costs. It fosters transparency, improves communication about money, and makes collaborative financial management effortless and secure.
    `
  },
  {
    slug: 'crud-operations',
    icon: ArrowLeftRight,
    title: 'Full CRUD Operations',
    description: 'Create, read, edit, and delete transactions with ease.',
    longDescription: `
## Your Financial Data, Under Your Complete Control

At the heart of any powerful financial management tool is the ability to maintain a perfectly accurate and up-to-date record of your transactions. Expense Pro provides full CRUD (Create, Read, Update, Delete) capabilities, giving you complete and granular control over every single entry in your financial history. This ensures that your records are not just a static import, but a living, breathing ledger that you can meticulously curate for absolute precision.

This fundamental feature set empowers you to manage your data with confidence, knowing that no mistake is permanent and no detail is too small to correct.

### The Four Pillars of Data Control:

*   **Create:** This is the most basic and essential function. You can add new transactions—both income and expenses—at any time. Our streamlined forms make it quick to enter details like the description, amount, category, and date. For recurring payments, you can create a template once, and the system will generate the instances automatically.
*   **Read:** Your data is presented in a clear, accessible, and searchable format. The transactions table allows you to view all your entries, sorted and filtered to your exact needs. This "read" capability is supercharged by our advanced filtering and search features, allowing you to instantly find any transaction you're looking for.
*   **Update:** Mistakes happen. Maybe you entered the wrong amount, assigned an expense to the wrong category, or forgot to add a note. With the update functionality, you can easily edit any aspect of a transaction at any time (with specific rules for recurring instances to maintain integrity). This ensures your financial reports are always based on the most accurate information possible.
*   **Delete:** Sometimes a transaction is entered by mistake, or a duplicate is imported. The delete function allows you to permanently remove these incorrect entries, cleaning up your records and ensuring your financial statements are pristine. A confirmation step protects you from accidental deletions.

Having full CRUD control means you can trust your data implicitly. It turns Expense Pro from a passive reporting tool into an active financial management system. Whether you're correcting a simple typo or re-categorizing a batch of expenses for tax season, you have the power and flexibility to ensure your financial records are a perfect reflection of reality.
    `
  },
  {
    slug: 'advanced-filtering',
    icon: Filter,
    title: 'Advanced Filtering',
    description: 'Powerful filters for date, category, type, and text search.',
    longDescription: `
## Find the Needle in Your Financial Haystack

A wealth of financial data is only useful if you can find the specific information you need, when you need it. Expense Pro's Advanced Filtering and Sorting capabilities transform your transaction list from a simple log into a powerful, searchable database. This feature allows you to ask complex questions about your finances and get instant answers, providing clarity and insight that would be impossible to achieve with a manual review.

Our intuitive filtering interface is designed to be both powerful and easy to use. You can slice and dice your data across multiple dimensions to isolate exactly what you're looking for. This is crucial for everything from budget analysis to tax preparation.

### Your Filtering Toolkit:

*   **Text Search:** Have a specific transaction in mind? Just start typing. Our search function scans transaction descriptions and transfer notes to instantly find matches. It's the fastest way to locate a particular purchase or payment.
*   **Date Range:** This is one of the most powerful filters. You can select from pre-defined ranges like "This Month" or "Last Year," or choose a completely custom date range from a calendar. This allows you to analyze your spending for specific periods, like a vacation or a tax year.
*   **Category:** Want to see how much you've spent on "Groceries" or "Entertainment"? Simply select the category from a dropdown to see all related transactions. This is fundamental for understanding your spending habits and checking your budget adherence.
*   **Transaction Type:** Easily separate your cash flow by filtering for only "Income" or only "Expenses." This helps you analyze your earnings and spending independently.
*   **Amount Range:** Need to find all transactions over a certain value, or isolate small, miscellaneous purchases? Set a minimum and/or maximum amount to narrow down your results.
*   **Account:** If you manage multiple accounts, you can filter to see transactions from just one specific account, like your primary checking account or a specific credit card.

You can combine these filters to create highly specific queries, such as: "Show all expenses from my 'HDFC Credit Card' account in the 'Dining Out' category between June 1st and August 31st that were over ₹1000." The ability to answer such questions in seconds is what makes Advanced Filtering an indispensable tool for true financial analysis.
    `
  },
  {
    slug: 'data-export',
    icon: FileDown,
    title: 'Data Export',
    description: 'Export your filtered transaction data to XLSX or CSV formats.',
    longDescription: `
## Your Data, Liberated

At Expense Pro, we believe that your financial data belongs to you. While our platform provides powerful tools for analysis and visualization, we understand that you may have your own unique needs for your data. Whether it's for offline backup, advanced spreadsheet analysis, sharing with a financial advisor, or tax preparation, our Data Export feature ensures you have complete freedom and control over your information.

We've made the export process as flexible and powerful as our filtering tools. You don't just get a massive, unfiltered data dump. Instead, you can leverage our advanced filtering system to create highly specific, targeted exports. This means the data you export is already tailored to your exact requirements, saving you time and effort in post-processing.

### How It Works:

1.  **Filter Your Data:** Start by using our comprehensive filtering options on the transactions page. You can narrow down your data by date range, account, category, transaction type, amount, and even text search. For example, you could filter for all "Business" category expenses from the last financial year.
2.  **Choose Your Format:** Once you have the precise dataset you need, you can choose to export it in two universally compatible formats:
    *   **Excel (.xlsx):** Perfect for those who want to perform further analysis using spreadsheet software like Microsoft Excel or Google Sheets. The exported file is well-structured with clear headers, ready for you to create your own pivot tables, charts, or custom calculations.
    *   **CSV (.csv):** A Comma-Separated Values file is a simple, plain-text format that is compatible with virtually any data analysis tool, programming language, or database system. This is an ideal choice for developers, data scientists, or for importing into other specialized software.
3.  **Download Instantly:** With a single click, Expense Pro generates the file and your download begins. The process is quick and efficient, even for large datasets.

The ability to export your data provides ultimate flexibility and peace of mind. It ensures you're not locked into our platform and can maintain your own archives. For freelancers and small business owners, this feature is invaluable for accounting and tax purposes. For data-savvy individuals, it opens up a world of possibilities for custom analysis. With Expense Pro, you get the best of both worlds: a powerful in-app experience and the unrestricted freedom to use your data wherever and however you choose.
    `
  },
  {
    slug: 'smart-categorization',
    icon: Tag,
    title: 'Smart Categorization',
    description: 'Intuitive category management with inline creation.',
    longDescription: `
## Effortless Organization for Ultimate Clarity

Accurate categorization is the bedrock of meaningful financial analysis. Without it, reports are meaningless and budgets are impossible to track. Expense Pro's Smart Categorization feature is designed to make this crucial process as effortless and accurate as possible, combining intelligent automation with user-friendly manual controls.

The goal is to provide you with a pristine, well-organized transaction history with minimal effort, which in turn powers all the insightful charts and reports throughout the application.

### Intelligent Suggestions & Automation:

The "smart" part of our categorization begins the moment you import data, especially from PDF bank statements. Our AI engine analyzes the description of each transaction and suggests a relevant category. A transaction at "Starbucks" is automatically recommended for "Dining Out," while a payment to "Netflix" is flagged for "Subscriptions." This automation handles the vast majority of your categorization work for you, saving you countless hours.

The system also learns from your habits. If you consistently re-categorize a specific merchant—for example, moving your local farm stand purchases from "Groceries" to a custom "Local Produce" category—Expense Pro will remember your preference and suggest it for future transactions from that merchant.

### Full Control and Flexibility:

While automation is powerful, you always have the final say. We provide several intuitive ways to manage your categories:

*   **Easy Editing:** You can change the category of any transaction with a simple dropdown menu.
*   **Custom Categories:** You are not limited to our default set of categories. You have the power to create, edit, and delete your own categories to perfectly match your unique spending habits. This allows you to create a system that makes sense to you, whether it's tracking expenses for a specific hobby, a side project, or a personal goal.
*   **Inline Creation:** This is a major time-saver. When adding or editing a transaction, if the perfect category doesn't exist yet, you don't have to navigate to a separate settings page. You can simply start typing the new category name in the combobox selector and an option to "Create..." will appear. With one click, the new category is created and assigned to your transaction, keeping your workflow smooth and uninterrupted.

By combining AI-driven suggestions with flexible, on-the-fly user controls, Smart Categorization ensures your financial data is not only complete but also impeccably organized. This high-quality data is the foundation that enables powerful budgeting, accurate spending analysis, and truly insightful financial reports.
    `
  },
  {
    slug: 'budgeting-and-goals',
    icon: Target,
    title: 'Budgeting & Goals',
    description: 'Set monthly budgets and track savings goals visually.',
    longDescription: `
## From Planning to Achieving: Your Financial Roadmap

Expense Pro empowers you to be proactive with your finances, not just reactive. Our integrated Budgeting and Goals features provide the framework to turn your financial aspirations into an actionable plan. These tools work together to help you control your spending, grow your savings, and build a secure financial future, one step at a time.

### Master Your Spending with Intuitive Budgeting:

A budget is a plan for your money, and our tool makes creating and sticking to that plan simple. Instead of a rigid, all-or-nothing approach, Expense Pro allows you to set flexible spending limits for specific categories.

*   **Category-Specific Budgets:** Focus on the areas that matter. Set a monthly budget for "Dining Out," "Shopping," or "Groceries" to gain control over variable spending.
*   **Flexible Timeframes:** While monthly budgets are common, you can also set yearly budgets for less frequent but significant expenses, such as holidays or annual subscriptions.
*   **Visual Progress Tracking:** Our dashboard provides a real-time, visual comparison of your actual spending against your budgeted amount for each category. A simple progress bar shows you exactly where you stand, so you know if you're on track, have room to spend, or need to cut back.
*   **Smart Alerts:** To help you stay on course, the system can send you notifications when you're approaching or have exceeded your budget in a particular category. This proactive feedback loop is crucial for building better spending habits.

### Turn Dreams into Reality with Savings Goals:

A savings goal gives your money purpose. Whether you're saving for a down payment, a new car, a dream vacation, or building an emergency fund, our Goals feature provides the motivation and tracking you need.

*   **Define Your Target:** Create a new goal by giving it a name, a target amount, and an optional target date. This simple act makes your goal tangible and real.
*   **Track Your Contributions:** As you save money, you can easily add contributions to your goal. The system keeps a running total of your saved amount, showing you exactly how far you've come.
*   **Visualize Your Success:** Nothing is more motivating than seeing your progress. Each goal is represented by a visual progress bar and a percentage completion, giving you an instant sense of accomplishment and encouraging you to keep going.
*   **Calculated Path:** The tool shows you how much you've saved and how much is remaining, keeping your target in clear view.

Together, Budgeting and Goals provide a powerful one-two punch for financial success. Budgeting helps you free up more cash by controlling your spending, while Goals give you a clear and motivating purpose for that extra cash.
    `
  },
  {
    slug: 'debt-management',
    icon: Scale,
    title: 'Debt Management',
    description: 'Track loans with details on interest, duration, and status.',
    longDescription: `
## Conquer Your Debt with Confidence and Clarity

Managing debt can be one ofthe most stressful aspects of personal finance. Multiple loans, varying interest rates, and different due dates can create a confusing and overwhelming picture. Expense Pro's comprehensive Debt Management feature is designed to cut through that complexity, providing you with a clear, strategic, and empowering tool to track, manage, and ultimately eliminate your debts.

This feature allows you to create a centralized inventory of all your liabilities, whether it's money you've borrowed (taken) or money you've lent to others (given). It's a complete solution for understanding the true impact of debt on your financial health.

### A Detailed View of Every Debt:

For each debt record, you can capture all the crucial details:
*   **Principal Amount:** The original amount of the loan.
*   **Counterparty:** Who the debt is with, whether it's a bank, a family member, or a friend.
*   **Interest Rate & Type:** Enter the annual interest rate and specify whether it's **Simple** (calculated only on the principal) or **Compound** (calculated on the principal plus accumulated interest). This is vital for understanding the true cost of borrowing.
*   **Loan Term:** Define the total duration of the loan in days, weeks, months, or years.
*   **Start Date & Payment Frequency:** Set the loan's start date and how often payments are expected (e.g., monthly, weekly), which helps in projecting your payment schedule.

### Powerful Insights and Tools:

*   **Amortization Schedule (Coming Soon):** The system can generate a full payment schedule, showing you how each payment is split between principal and interest over the entire life of the loan. This provides incredible clarity on your payment journey.
*   **Final Due Date Calculation:** Based on the start date and term, the system automatically calculates the final due date, so you always know your payoff timeline.
*   **Status Tracking:** Mark debts as "Paid" to move them from your active liabilities to your financial history, giving you a powerful sense of accomplishment.
*   **Integrated Interest Calculator:** Unsure about the terms of a potential loan? Use our built-in interest calculator to model different scenarios before you even create a debt record. You can see the total interest and total amount payable for any combination of principal, rate, and term.

By consolidating all your debt information into one place and providing powerful analytical tools, the Debt Management feature transforms debt from a source of anxiety into a manageable financial challenge. It gives you the clarity and confidence you need to create an effective payoff strategy and accelerate your journey to becoming debt-free.
    `
  },
  {
    slug: 'investment-tracking',
    icon: TrendingUp,
    title: 'Investment Tracking',
    description: 'Monitor holdings and overall portfolio performance.',
    longDescription: `
## Your Complete Investment Picture, Consolidated

For many, growing wealth is just as important as managing expenses. However, tracking investments can be a fragmented and tedious process, often requiring you to log into multiple brokerage accounts and manually aggregate the data. Expense Pro's Investment Tracking feature solves this by providing a single, consolidated platform to monitor all your holdings and understand your overall portfolio performance.

This feature allows you to go beyond daily spending and get a high-level view of your wealth-building strategy. It's designed for both beginner investors and seasoned market participants who want a unified dashboard for their assets.

### Centralize Your Portfolio:

*   **Multiple Investment Accounts:** Create separate accounts for each of your brokerage platforms (e.g., "Zerodha Stocks," "Groww Mutual Funds," "HDFC Securities"). This keeps your holdings organized just as they are in the real world.
*   **Track Individual Holdings:** Within each account, you can add and manage your individual investments. Log your stocks, mutual funds, or other assets with key details like the symbol, number of shares, purchase price, and purchase date.
*   **Dividend Tracking:** Easily record dividends received from your investments. This is crucial for accurately calculating your total return, as dividends are a key component of investment gains.

### Powerful Performance Analysis:

*   **Real-Time (or near real-time) Valuation:** Our system can fetch current market prices for many popular stocks, giving you an up-to-date valuation of your holdings and your entire portfolio.
*   **Gain/Loss Calculation:** Expense Pro automatically calculates your unrealized profit or loss for each holding and for your portfolio as a whole. It compares your total invested amount against the current market value to give you a clear picture of your performance.
*   **Portfolio Summary:** The dashboard provides a high-level summary of your entire investment landscape, showing your total invested amount, current market value, and overall gain/loss percentage. This allows you to assess your performance at a glance.
*   **Historical Performance Charts (Coming Soon):** Future updates will introduce interactive charts that track the value of your portfolio over time, allowing you to visualize your growth and compare your performance against market benchmarks.

By bringing all your investment data under one roof, Expense Pro eliminates the complexity of portfolio management. You can quickly see which investments are performing well, understand your asset allocation, and make more informed decisions about your wealth-building strategy, all within the same app you use to manage your daily expenses.
    `
  }
];
