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
  gridSpan: string;
  visible: boolean;
}

export type PresetConfig = Record<string, CardConfig>;

export const DASHBOARD_CARD_CONFIG: Record<string, PresetConfig> = {
  default: {
    financialHealth: {
      title: 'Financial Health Score',
      description: 'Overall financial wellness assessment',
      gridSpan: 'col-span-12',
      visible: true
    },
    financialSnapshot: {
      title: 'Financial Snapshot',
      description: 'Key metrics overview',
      gridSpan: 'col-span-12',
      visible: true
    },
    trendChart: {
      title: 'Financial Trends',
      description: 'Income, Expense, Balance',
      gridSpan: 'col-span-12 lg:col-span-8',
      visible: true
    },
    spendingBreakdown: {
      title: 'Spending Breakdown',
      icon: <Tag className='h-5 w-5 text-orange-500' />,
      description: 'Top expense categories',
      gridSpan: 'col-span-12 lg:col-span-4',
      visible: true
    },
    budgetProgress: {
      title: 'Budget Progress',
      icon: <CalendarRange className='h-5 w-5 text-lime-600' />,
      description: 'Spending vs budget',
      gridSpan: 'col-span-12 lg:col-span-6',
      visible: true
    },
    goals: {
      title: 'Goal Highlights',
      icon: <Target className='h-5 w-5 text-amber-500' />,
      description: 'Top active saving goals',
      gridSpan: 'col-span-12 lg:col-span-6',
      visible: true
    },
    investments: {
      title: 'Investment Summary',
      description: 'Portfolio overview',
      gridSpan: 'col-span-12 lg:col-span-8',
      visible: true
    },
    debtSummary: {
      title: 'Debt Summary',
      icon: <Scale className='h-5 w-5 text-red-500' />,
      description: 'Outstanding debts',
      gridSpan: 'col-span-12 lg:col-span-4',
      visible: true
    },
    accounts: {
      title: 'Account Balances',
      icon: <CreditCard className='h-5 w-5 text-cyan-500' />,
      description: 'Top 5 accounts by balance',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: true
    },
    quickStats: {
      title: 'Quick Stats',
      icon: <BarChart4 className='h-5 w-5 text-purple-500' />,
      description: 'Key transaction figures',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: true
    }
  },
  budgetFocus: {
    financialSnapshot: {
      title: 'Financial Snapshot',
      description: 'Key metrics overview',
      gridSpan: 'col-span-12',
      visible: true
    },
    budgetProgress: {
      title: 'Budget Progress',
      icon: <CalendarRange className='h-5 w-5 text-lime-600' />,
      description: 'Spending vs budget',
      gridSpan: 'col-span-12 lg:col-span-8',
      visible: true
    },
    spendingBreakdown: {
      title: 'Spending Breakdown',
      icon: <Tag className='h-5 w-5 text-orange-500' />,
      description: 'Top expense categories',
      gridSpan: 'col-span-12 lg:col-span-4',
      visible: true
    },
    trendChart: {
      title: 'Financial Trends',
      description: 'Income, Expense, Balance',
      gridSpan: 'col-span-12',
      visible: true
    },
    accounts: {
      title: 'Account Balances',
      icon: <CreditCard className='h-5 w-5 text-cyan-500' />,
      description: 'Top 5 accounts by balance',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: true
    },
    quickStats: {
      title: 'Quick Stats',
      icon: <BarChart4 className='h-5 w-5 text-purple-500' />,
      description: 'Key transaction figures',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: true
    },
    financialHealth: {
      title: 'Financial Health Score',
      gridSpan: 'col-span-12',
      visible: false
    },
    goals: {
      title: 'Goal Highlights',
      icon: <Target className='h-5 w-5 text-amber-500' />,
      gridSpan: 'col-span-12 md:col-span-6',
      visible: false
    },
    investments: {
      title: 'Investment Summary',
      gridSpan: 'col-span-12 md:col-span-6',
      visible: false
    },
    debtSummary: {
      title: 'Debt Summary',
      icon: <Scale className='h-5 w-5 text-red-500' />,
      gridSpan: 'col-span-12 md:col-span-6',
      visible: false
    }
  },
  investmentFocus: {
    investments: {
      title: 'Investment Summary',
      description: 'Portfolio overview',
      gridSpan: 'col-span-12 lg:col-span-8',
      visible: true
    },
    debtSummary: {
      title: 'Debt Summary',
      icon: <Scale className='h-5 w-5 text-red-500' />,
      description: 'Outstanding debts',
      gridSpan: 'col-span-12 lg:col-span-4',
      visible: true
    },
    accounts: {
      title: 'Account Balances',
      icon: <CreditCard className='h-5 w-5 text-cyan-500' />,
      description: 'Top 5 accounts by balance',
      gridSpan: 'col-span-12',
      visible: true
    },
    financialHealth: {
      title: 'Financial Health Score',
      gridSpan: 'col-span-12',
      visible: false
    },
    financialSnapshot: {
      title: 'Financial Snapshot',
      gridSpan: 'col-span-12',
      visible: false
    },
    trendChart: {
      title: 'Financial Trends',
      gridSpan: 'col-span-12 lg:col-span-8',
      visible: false
    },
    spendingBreakdown: {
      title: 'Spending Breakdown',
      icon: <Tag className='h-5 w-5 text-orange-500' />,
      gridSpan: 'col-span-12 lg:col-span-4',
      visible: false
    },
    budgetProgress: {
      title: 'Budget Progress',
      icon: <CalendarRange className='h-5 w-5 text-lime-600' />,
      gridSpan: 'col-span-12 md:col-span-6 xl:col-span-3',
      visible: false
    },
    goals: {
      title: 'Goal Highlights',
      icon: <Target className='h-5 w-5 text-amber-500' />,
      gridSpan: 'col-span-12 md:col-span-6 xl:col-span-3',
      visible: false
    },
    quickStats: {
      title: 'Quick Stats',
      icon: <BarChart4 className='h-5 w-5 text-purple-500' />,
      gridSpan: 'col-span-12 md:col-span-6',
      visible: false
    }
  }
};
