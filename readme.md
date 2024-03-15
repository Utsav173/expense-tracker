## Expense Tracker Documentation

### End User Guide

**Getting Started:**

* **Create an Account:**
  * Sign up with your email address and password.
  * Optionally, upload a profile picture.
  * A default account will be created for you.
* **Log In**:
  * Enter your email address and password to log in.
  * If you forget your password, use the "Forgot Password" link to reset it.

**Account Management:**

* **Create New Account:**
  * Click the "Add Account" button.
  * Provide a name and initial balance (optional).
  * Click "Create" to add the account.
* **Edit Account:**
  * Hover over the account card and click the "Edit" icon.
  * Modify the account name.
  * Click "Update" to save changes.
* **Delete Account:**
  * Hover over the account card and click the "Delete" icon.
  * Confirm the deletion to remove the account.

**Transaction Tracking:**

* **Add Transaction:**
  * Click the "Add Transaction" button.
  * Enter the transaction text, amount, type (income or expense), transfer details, and category.
  * Optionally, select a different date and time.
  * Click "Create" to add the transaction.
* **Edit Transaction:**
  * Click the "Edit" icon next to the transaction.
  * Modify the transaction details as needed.
  * Click "Update" to save changes.
* **Delete Transaction:**
  * Click the "Delete" icon next to the transaction.
  * Confirm the deletion to remove the transaction.

**Analytics and Insights:**

* **Dashboard:**
  * View an overview of your financial data, including total accounts, total transactions, overall income, expense, and balance.
  * Explore interactive charts that show trends and patterns in your income, expenses, and balance over time.
  * Filter the data by duration (today, this week, this month, this year, or all time) and field (amount, transfer, text, or type) to gain specific insights.
* **Account Details:**
  * View detailed information about a specific account, including its balance, income, expense, and a list of transactions.
  * Filter transactions by duration and search for specific transactions using keywords.
  * Generate statements for the account to export the data in PDF format.

**Import and Export:**

* **Import Transactions:**
  * Go to the "Import" page.
  * Select an account to import transactions into.
  * Choose an XLSX file containing your transaction data.
  * Click "Import" to upload and process the file.
  * Review the imported data and confirm the import to add the transactions to your account.
* **Export Statements:**
  * Go to the "Statements" page.
  * Select an account to generate a statement for.
  * Choose a date range or specify the number of recent transactions to include.
  * Click "Generate" to create a PDF statement that you can download or print.

**Account Sharing:**

* **Share Account:**
  * Go to the "Account" page for the account you want to share.
  * Click the "Share Account" button.
  * Select the user you want to share the account with from the dropdown list.
  * Click "Share" to grant the user access to the account.
* **View Shared Accounts:**
  * Go to the "Shared Accounts" page.
  * You'll see a list of accounts that have been shared with you by other users.
  * Click on an account card to view its details and transactions.

### Backend Documentation

**Technologies:**

* Node.js
* Express
* MongoDB
* Mongoose
* Nodemailer
* Crypto
* Sharp
* Date-fns
* XLSX
* EJS
* Puppeteer

**API Endpoints:**

* /auth/login: Handles user login.
* /auth/signup: Handles user signup.
* /auth/me: Retrieves the currently logged-in user's information.
* /auth/logout: Logs the user out.
* /auth/forgot-password: Sends a password reset link to the user's email.
* /auth/reset-password: Resets the user's password.
* /accounts/dashboard: Retrieves dashboard data, including account information, transaction counts, and overall financial statistics.
* /accounts/:id: Retrieves a list of the user's accounts.
* /accounts/searchTerm: Searches for transactions based on a query.
* /accounts/:id: Creates a new account.
* /accounts/:id: Updates an existing account.
* /accounts/:id: Deletes an account.
* /accounts/:id: Retrieves details of a specific account.
* /accounts/previous/share/:id: Retrieves previous share information for an account.
* /accounts/dropdown/user: Retrieves a list of users for account sharing.
* /accounts/share: Shares an account with another user.
* /accounts/get-shares: Retrieves a list of accounts shared with the user.
* /accounts/customAnalytics/:id: Generates custom analytics for a specific account.
* /accounts/:id/import: Imports transactions into an account from an XLSX file.
* /accounts/:id/export: Generates a PDF statement for an account.
* /transactions/:id: Retrieves a list of transactions for an account.
* /transactions/:id: Creates a new transaction.
* /transactions/:id: Updates an existing transaction.
* /transactions/:id: Deletes a transaction.
* /transactions/analytics/:id: Generates analytics data for transactions.
* /transactions/:id/share: Shares a transaction with another user.

