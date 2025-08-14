import { Icon } from '@/components/ui/icon';

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
      icon: <Icon name='tag' className='h-5 w-5 text-orange-500' />,
      description: 'Top expense categories',
      visible: true
    },
    budgetProgress: {
      title: 'Budget Progress',
      icon: <Icon name='calendarRange' className='h-5 w-5 text-lime-600' />,
      description: 'Spending vs budget',
      visible: true
    },
    goals: {
      title: 'Goal Highlights',
      icon: <Icon name='target' className='h-5 w-5 text-amber-500' />,
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
      icon: <Icon name='scale' className='h-5 w-5 text-red-500' />,
      description: 'Outstanding debts',
      visible: true
    },
    accounts: {
      title: 'Account Balances',
      icon: <Icon name='creditCard' className='h-5 w-5 text-cyan-500' />,
      description: 'Top 5 accounts by balance',
      visible: true
    },
    quickStats: {
      title: 'Quick Stats',
      icon: <Icon name='barChart4' className='h-5 w-5 text-purple-500' />,
      description: 'Key transaction figures',
      visible: true
    }
  }
};
