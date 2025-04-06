export const DASHBOARD_PRESETS: Record<string, string> = {
  default: 'Default View',
  budgetFocus: 'Budget Focus',
  savingsFocus: 'Savings Focus',
  investmentFocus: 'Investment Focus',
  debtFocus: 'Debt Focus'
};

export const TIME_RANGES = [
  { label: 'This Month', value: 'month' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Year to Date', value: 'ytd' },
  { label: 'Last 12 Months', value: '12m' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom Range', value: 'custom' }
];

interface CardConfig {
  title: string;
  description?: string;
  gridSpan: string;
  visible: boolean;
  noPadding?: boolean;
}

export type PresetConfig = Record<string, CardConfig>;

export const DASHBOARD_CARD_CONFIG: Record<string, PresetConfig> = {
  default: {
    financialHealth: {
      title: 'Financial Health Score',
      description: 'Overall financial wellness assessment',
      gridSpan: 'col-span-12',
      visible: true,
      noPadding: false
    },
    financialSnapshot: {
      title: 'Financial Snapshot',
      description: 'Key metrics overview',
      gridSpan: 'col-span-12',
      visible: true,
      noPadding: true
    },
    trendChart: {
      title: 'Financial Trends',
      description: 'Income, Expense, Balance',
      gridSpan: 'col-span-12 lg:col-span-8',
      visible: true,
      noPadding: true
    },
    spendingBreakdown: {
      title: 'Spending Breakdown',
      description: 'Top expense categories',
      gridSpan: 'col-span-12 lg:col-span-4',
      visible: true,
      noPadding: true
    },
    budgetProgress: {
      title: 'Budget Progress',
      description: 'Spending vs budget',
      gridSpan: 'col-span-12 md:col-span-6 xl:col-span-3',
      visible: true,
      noPadding: false
    },
    goals: {
      title: 'Goal Highlights',
      description: 'Top active saving goals',
      gridSpan: 'col-span-12 md:col-span-6 xl:col-span-3',
      visible: true,
      noPadding: false
    },
    investments: {
      title: 'Investment Summary',
      description: 'Portfolio overview',
      gridSpan: 'col-span-12 md:col-span-6 xl:col-span-3',
      visible: true,
      noPadding: false
    },
    debtSummary: {
      title: 'Debt Summary',
      description: 'Outstanding debts',
      gridSpan: 'col-span-12 md:col-span-6 xl:col-span-3',
      visible: true,
      noPadding: false
    },
    accounts: {
      title: 'Account Balances',
      description: 'Top 5 accounts by balance',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: true,
      noPadding: true
    },
    quickStats: {
      title: 'Quick Stats',
      description: 'Key transaction figures',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: true,
      noPadding: false
    }
  },
  budgetFocus: {
    financialSnapshot: {
      title: 'Financial Snapshot',
      description: 'Key metrics overview',
      gridSpan: 'col-span-12',
      visible: true,
      noPadding: true
    },
    budgetProgress: {
      title: 'Budget Progress',
      description: 'Spending vs budget',
      gridSpan: 'col-span-12 lg:col-span-8',
      visible: true,
      noPadding: false
    },
    spendingBreakdown: {
      title: 'Spending Breakdown',
      description: 'Top expense categories',
      gridSpan: 'col-span-12 lg:col-span-4',
      visible: true,
      noPadding: true
    },
    trendChart: {
      title: 'Financial Trends',
      description: 'Income, Expense, Balance',
      gridSpan: 'col-span-12',
      visible: true,
      noPadding: true
    },
    goals: {
      title: 'Goal Highlights',
      description: 'Top active saving goals',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: false,
      noPadding: false
    },
    investments: {
      title: 'Investment Summary',
      description: 'Portfolio overview',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: false,
      noPadding: false
    },
    debtSummary: {
      title: 'Debt Summary',
      description: 'Outstanding debts',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: false,
      noPadding: false
    },
    accounts: {
      title: 'Account Balances',
      description: 'Top 5 accounts by balance',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: true,
      noPadding: true
    },
    quickStats: {
      title: 'Quick Stats',
      description: 'Key transaction figures',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: true,
      noPadding: false
    },
    financialHealth: {
      title: 'Financial Health Score',
      description: 'Overall financial wellness assessment',
      gridSpan: 'col-span-12',
      visible: true,
      noPadding: false
    }
  }
};
