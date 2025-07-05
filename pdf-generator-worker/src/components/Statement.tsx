import React from 'react';

interface Transaction {
	createdAt: string;
	text: string;
	category: { name: string };
	isIncome: boolean;
	amount: number;
	transfer?: string;
}

interface StatementProps {
	accountName: string;
	accountCurrency: string;
	dateRange: string;
	totalIncome: number;
	totalExpense: number;
	balance: number;
	incomePercentageChange: number;
	transactions: Transaction[];
	generatedAt?: string;
}

const formatCurrency = (amount: number = 0) => {
	return amount.toLocaleString('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

export const Statement = ({
	accountName,
	accountCurrency,
	dateRange,
	totalIncome = 0,
	totalExpense = 0,
	balance = 0,
	incomePercentageChange = 0,
	transactions = [],
	generatedAt = new Date().toLocaleString(),
}: StatementProps) => {
	const statementStyles = `
    :root { --color-primary: #4f46e5; --color-primary-dark: #3730a3; --color-text-header: #0f172a; --color-text-body: #334155; --color-text-muted: #64748b; --color-border: #e2e8f0; --color-background-light: #f8fafc; --accent-income: #059669; --accent-expense: #dc2626; --accent-balance: #0369a1; --accent-change: #7c3aed; }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    body { font-family: 'Inter', sans-serif; background: #f1f5f9; color: var(--color-text-body); line-height: 1.2; font-size: 10px; }
    .container { max-width: 8.27in; min-height: 11.69in; margin: 0 auto; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; }
    .header { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: white; padding: 12px 16px; text-align: center; position: relative; }
    .header h1 { font-size: 1.3rem; font-weight: 700; margin-bottom: 1px; letter-spacing: -0.025em; }
    .header .subtitle { font-size: 0.7rem; opacity: 0.9; }
    .account-info { background: var(--color-background-light); padding: 8px 16px; border-bottom: 1px solid var(--color-border); display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .account-detail { display: flex; align-items: center; gap: 6px; }
    .account-detail .icon { width: 20px; height: 20px; border-radius: 3px; font-size: 0.7rem; flex-shrink: 0; }
    .account-detail .info h3 { font-size: 0.55rem; margin-bottom: 0px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.3px; }
    .account-detail .info p { font-size: 0.7rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .main-content { padding: 12px 16px; flex-grow: 1; }
    .analytics-header { text-align: center; margin-bottom: 10px; }
    .analytics-header h2 { font-size: 1.1rem; margin-bottom: 1px; }
    .analytics-header p { font-size: 0.65rem; color: var(--color-text-muted); }
    .analytics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat-card { border: 1px solid var(--color-border); border-top: 2px solid var(--card-accent); border-radius: 4px; padding: 8px; text-align: center; }
    .stat-card.income { --card-accent: var(--accent-income); }
    .stat-card.expense { --card-accent: var(--accent-expense); }
    .stat-card.balance { --card-accent: var(--accent-balance); }
    .stat-card.change { --card-accent: var(--accent-change); }
    .stat-card h3 { font-size: 0.55rem; margin-bottom: 3px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.3px; }
    .stat-card .amount { font-size: 0.95rem; font-weight: 700; line-height: 1.1; margin-bottom: 1px; }
    .stat-card .currency { font-size: 0.6rem; color: var(--color-text-muted); }
    .transactions-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--color-border); }
    .transactions-header h2 { font-size: 1rem; }
    .transaction-count { padding: 2px 6px; border-radius: 8px; font-size: 0.6rem; background: var(--color-background-light); color: var(--color-text-muted); }
    .table-container { width: 100%; border: 1px solid var(--color-border); border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); }
    table { width: 100%; border-collapse: collapse; font-size: 0.65rem; table-layout: fixed; }
    th, td { padding: 4px 6px; text-align: left; border-bottom: 1px solid #f1f5f9; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    th { font-weight: 600; color: var(--color-text-muted); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.3px; background: var(--color-background-light); }
    th:nth-child(1), td:nth-child(1) { width: 10%; }
    th:nth-child(2), td:nth-child(2) { width: 30%; }
    th:nth-child(3), td:nth-child(3) { width: 15%; }
    th:nth-child(4), td:nth-child(4) { width: 15%; text-align: right; }
    th:nth-child(5), td:nth-child(5) { width: 15%; text-align: right; }
    th:nth-child(6), td:nth-child(6) { width: 15%; text-align: center; }
    td { font-size: 0.65rem; vertical-align: middle; }
    .transaction-text { font-weight: 500; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .transaction-category, .transfer-badge { padding: 1px 4px; border-radius: 2px; font-size: 0.55rem; background: var(--color-background-light); color: var(--color-text-muted); display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .amount { font-weight: 600; font-size: 0.7rem; }
    .income-amount { color: var(--accent-income); }
    .expense-amount { color: var(--accent-expense); }
    .no-transactions { padding: 16px; font-size: 0.7rem; text-align: center; color: var(--color-text-muted); }
    .no-transactions h3 { font-size: 0.85rem; margin-bottom: 4px; }
    .footer { background: var(--color-background-light); padding: 8px 16px; text-align: center; border-top: 1px solid var(--color-border); font-size: 0.6rem; color: var(--color-text-muted); }
    .footer p:last-child { font-size: 0.55rem; margin-top: 1px; }
    @media print { body { background: white; font-size: 7pt; } .container { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; border: none; } @page { size: A4; margin: 0.3in; } .analytics-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; } .stat-card { padding: 6px; } th, td { padding: 3px 4px; } .header { padding: 8px 12px; } .main-content, .account-info { padding: 8px 12px; } .footer { padding: 6px 12px; } }
    @media (max-width: 900px) { .analytics-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; } .container { margin: 4px; } .account-info { grid-template-columns: 1fr; gap: 6px; } }
    @media (max-width: 600px) { body { font-size: 9px; } .account-info { grid-template-columns: 1fr; gap: 6px; } .analytics-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; } .main-content, .account-info, .header, .footer { padding: 8px 10px; } .transactions-header { flex-direction: column; align-items: flex-start; gap: 4px; } table { font-size: 0.6rem; } th, td { padding: 3px 4px; } .stat-card .amount { font-size: 0.85rem; } th:nth-child(3), td:nth-child(3) { display: none; } th:nth-child(1), td:nth-child(1) { width: 15%; } th:nth-child(2), td:nth-child(2) { width: 40%; } th:nth-child(4), td:nth-child(4) { width: 22.5%; } th:nth-child(5), td:nth-child(5) { width: 22.5%; } }
  `;
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				{/* The fix is here */}
				<title>{`Statement - ${accountName}`}</title>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
					rel="stylesheet"
				/>
				<style dangerouslySetInnerHTML={{ __html: statementStyles }} />
			</head>
			<body>
				<div className="container">
					{/* ... rest of the component is unchanged ... */}
					<header className="header">
						<h1>Financial Statement</h1>
						<p className="subtitle">Comprehensive Account Overview</p>
					</header>

					<section className="account-info">
						<div className="account-detail">
							<div className="icon">🏦</div>
							<div className="info">
								<h3>Account Name</h3>
								<p>{accountName}</p>
							</div>
						</div>
						<div className="account-detail">
							<div className="icon">💰</div>
							<div className="info">
								<h3>Currency</h3>
								<p>{accountCurrency}</p>
							</div>
						</div>
						<div className="account-detail">
							<div className="icon">📅</div>
							<div className="info">
								<h3>Period</h3>
								<p>{dateRange}</p>
							</div>
						</div>
					</section>

					<main className="main-content">
						<section className="analytics-section">
							<div className="analytics-header">
								<h2>Financial Overview</h2>
								<p>Summary of your financial activity</p>
							</div>
							<div className="analytics-grid">
								<div className="stat-card income">
									<h3>Total Income</h3>
									<div className="amount income-amount">
										{formatCurrency(totalIncome)}
									</div>
									<div className="currency">{accountCurrency}</div>
								</div>
								<div className="stat-card expense">
									<h3>Total Expenses</h3>
									<div className="amount expense-amount">
										{formatCurrency(totalExpense)}
									</div>
									<div className="currency">{accountCurrency}</div>
								</div>
								<div className="stat-card balance">
									<h3>Net Balance</h3>
									<div
										className={`amount ${
											balance >= 0 ? 'income-amount' : 'expense-amount'
										}`}
									>
										{formatCurrency(balance)}
									</div>
									<div className="currency">{accountCurrency}</div>
								</div>
								<div className="stat-card change">
									<h3>Income Change</h3>
									<div
										className={`amount ${
											incomePercentageChange >= 0
												? 'income-amount'
												: 'expense-amount'
										}`}
									>
										{incomePercentageChange.toFixed(1)}%
									</div>
									<div className="currency">vs Prev. Period</div>
								</div>
							</div>
						</section>

						<section className="transactions-section">
							<div className="transactions-header">
								<h2>Transaction History</h2>
								<div className="transaction-count">
									{transactions.length} transactions
								</div>
							</div>

							{transactions.length > 0 ? (
								<div className="table-container">
									<table>
										<thead>
											<tr>
												<th>Date</th>
												<th>Description</th>
												<th>Category</th>
												<th>Credit</th>
												<th>Debit</th>
												<th>Transfer</th>
											</tr>
										</thead>
										<tbody>
											{transactions.map((transaction, index) => (
												<tr key={index}>
													<td>
														{new Date(transaction.createdAt).toLocaleDateString(
															'en-GB',
															{
																month: 'short',
																day: 'numeric',
																year: 'numeric',
															}
														)}
													</td>
													<td>
														<div className="transaction-text">
															{transaction.text || 'No description'}
														</div>
													</td>
													<td>
														{transaction.category?.name ? (
															<span className="transaction-category">
																{transaction.category.name}
															</span>
														) : (
															<span style={{ color: '#9ca3af' }}>
																Uncategorized
															</span>
														)}
													</td>
													<td>
														{transaction.isIncome && (
															<span className="amount income-amount">
																+{formatCurrency(transaction.amount)}
															</span>
														)}
													</td>
													<td>
														{!transaction.isIncome && (
															<span className="amount expense-amount">
																-{formatCurrency(transaction.amount)}
															</span>
														)}
													</td>
													<td>
														{transaction.transfer && (
															<span className="transfer-badge">
																{transaction.transfer}
															</span>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="no-transactions">
									<h3>No Transactions Found</h3>
									<p>
										There are no transactions to display for the selected
										period.
									</p>
								</div>
							)}
						</section>
					</main>

					<footer className="footer">
						<p>This statement was generated on your request.</p>
						<p>Generated on {generatedAt}</p>
					</footer>
				</div>
			</body>
		</html>
	);
};
