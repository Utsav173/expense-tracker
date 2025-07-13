import { BarChart4, CalendarRange, CreditCard, Scale, Tag, Target } from 'lucide-react';

export const DASHBOARD_PRESETS: Record<string, string> = {
  default: 'Default View',
  budgetFocus: 'Budget Focus',
  savingsFocus: 'Savings Focus',
  investmentFocus: 'Investment Focus',
  debtFocus: 'Debt Focus'
};

export const TIME_RANGES = [
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Year to Date', value: 'ytd' },
  { label: 'Last 12 Months', value: '12m' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom Range', value: 'custom' }
];

interface CardConfig {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  visible: boolean;
}

export type PresetConfig = Record<string, CardConfig>;

export const DASHBOARD_CARD_CONFIG: Record<string, PresetConfig> = {
  default: {
    financialHealth: {
      title: 'Financial Health Score',
      description: 'Overall financial wellness assessment',
      visible: true
    },
    financialSnapshot: {
      title: 'Financial Snapshot',
      description: 'Key metrics overview',
      visible: true
    },
    trendChart: {
      title: 'Financial Trends',
      description: 'Income, Expense, Balance',
      visible: true
    },
    spendingBreakdown: {
      title: 'Spending Breakdown',
      icon: <Tag className='h-5 w-5 text-orange-500' />,
      description: 'Top expense categories',
      visible: true
    },
    budgetProgress: {
      title: 'Budget Progress',
      icon: <CalendarRange className='h-5 w-5 text-lime-600' />,
      description: 'Spending vs budget',
      visible: true
    },
    goals: {
      title: 'Goal Highlights',
      icon: <Target className='h-5 w-5 text-amber-500' />,
      description: 'Top active saving goals',
      visible: true
    },
    investments: {
      title: 'Investment Summary',
      description: 'Portfolio overview',
      visible: true
    },
    debtSummary: {
      title: 'Debt Summary',
      icon: <Scale className='h-5 w-5 text-red-500' />,
      description: 'Outstanding debts',
      visible: true
    },
    accounts: {
      title: 'Account Balances',
      icon: <CreditCard className='h-5 w-5 text-cyan-500' />,
      description: 'Top 5 accounts by balance',
      visible: true
    },
    quickStats: {
      title: 'Quick Stats',
      icon: <BarChart4 className='h-5 w-5 text-purple-500' />,
      description: 'Key transaction figures',
      visible: true
    }
  },
  budgetFocus: {
    financialSnapshot: {
      title: 'Financial Snapshot',
      description: 'Key metrics overview',
      visible: true
    },
    trendChart: {
      title: 'Financial Trends',
      description: 'Income, Expense, Balance',
      visible: true
    },
    budgetProgress: {
      title: 'Budget Progress',
      icon: <CalendarRange className='h-5 w-5 text-lime-600' />,
      description: 'Spending vs budget',
      visible: true
    },
    spendingBreakdown: {
      title: 'Spending Breakdown',
      icon: <Tag className='h-5 w-5 text-orange-500' />,
      description: 'Top expense categories',
      visible: true
    },
    accounts: {
      title: 'Account Balances',
      icon: <CreditCard className='h-5 w-5 text-cyan-500' />,
      description: 'Top 5 accounts by balance',
      visible: true
    },
    quickStats: {
      title: 'Quick Stats',
      icon: <BarChart4 className='h-5 w-5 text-purple-500' />,
      description: 'Key transaction figures',
      visible: true
    },
    financialHealth: {
      title: 'Financial Health Score',
      visible: false
    },
    goals: {
      title: 'Goal Highlights',
      icon: <Target className='h-5 w-5 text-amber-500' />,
      visible: false
    },
    investments: {
      title: 'Investment Summary',
      visible: false
    },
    debtSummary: {
      title: 'Debt Summary',
      icon: <Scale className='h-5 w-5 text-red-500' />,
      visible: false
    }
  },
  investmentFocus: {
    investments: {
      title: 'Investment Summary',
      description: 'Portfolio overview',
      visible: true
    },
    debtSummary: {
      title: 'Debt Summary',
      icon: <Scale className='h-5 w-5 text-red-500' />,
      description: 'Outstanding debts',
      visible: true
    },
    accounts: {
      title: 'Account Balances',
      icon: <CreditCard className='h-5 w-5 text-cyan-500' />,
      description: 'Top 5 accounts by balance',
      visible: true
    },
    financialHealth: {
      title: 'Financial Health Score',
      visible: false
    },
    financialSnapshot: {
      title: 'Financial Snapshot',
      visible: false
    },
    trendChart: {
      title: 'Financial Trends',
      visible: false
    },
    spendingBreakdown: {
      title: 'Spending Breakdown',
      icon: <Tag className='h-5 w-5 text-orange-500' />,
      visible: false
    },
    budgetProgress: {
      title: 'Budget Progress',
      icon: <CalendarRange className='h-5 w-5 text-lime-600' />,
      visible: false
    },
    goals: {
      title: 'Goal Highlights',
      icon: <Target className='h-5 w-5 text-amber-500' />,
      visible: false
    },
    quickStats: {
      title: 'Quick Stats',
      icon: <BarChart4 className='h-5 w-5 text-purple-500' />,
      visible: false
    }
  }
};
