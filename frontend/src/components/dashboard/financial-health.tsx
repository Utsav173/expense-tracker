import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardData } from '@/lib/types';

interface FinancialHealthProps {
  data: DashboardData | null | undefined;
}

const FinancialHealth: React.FC<FinancialHealthProps> = ({ data }) => {
  const calculateFinancialHealthScore = () => {
    if (!data) return 0;
    const income = data.overallIncome ?? 0;
    const expense = data.overallExpense ?? 0;
    const savingsRatio = income > 0 ? Math.max(0, (income - expense) / income) : 0;
    const expenseRatio = income > 0 ? expense / income : expense > 0 ? 1 : 0;
    const incomeGrowth = data.overallIncomeChange ?? 0;

    let score = 50;

    if (savingsRatio > 0.25) score += 40;
    else if (savingsRatio > 0.15) score += 30;
    else if (savingsRatio > 0.05) score += 15;
    else if (savingsRatio > 0) score += 5;

    if (expenseRatio < 0.6) score += 30;
    else if (expenseRatio < 0.8) score += 20;
    else if (expenseRatio < 0.95) score += 10;

    if (incomeGrowth > 10) score += 30;
    else if (incomeGrowth > 5) score += 20;
    else if (incomeGrowth > 0) score += 10;
    else if (incomeGrowth < -5) score -= 10;

    return Math.min(Math.max(Math.round(score), 0), 100);
  };

  const financialHealthScore = useMemo(calculateFinancialHealthScore, [data]);

  const getHealthScoreMeta = (score: number) => {
    if (score > 80)
      return {
        badge: 'Excellent',
        color: 'bg-green-500 text-green-foreground',
        message: 'Your finances are in great shape!'
      };
    if (score > 60)
      return {
        badge: 'Good',
        color: 'bg-yellow-500 text-yellow-foreground',
        message: 'You have a solid financial foundation.'
      };
    if (score > 40)
      return {
        badge: 'Fair',
        color: 'bg-orange-500 text-orange-foreground',
        message: 'Some areas could use improvement.'
      };
    return {
      badge: 'Needs Attention',
      color: 'bg-red-500 text-red-foreground',
      message: 'Focus on improving key financial habits.'
    };
  };

  const healthScoreMeta = getHealthScoreMeta(financialHealthScore);

  return (
    <Card
      className={`border-l-4 ${healthScoreMeta.color.replace('bg-', 'border-l-').replace('text-.*', '')}`}
    >
      <CardContent className='p-4'>
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <div className='flex flex-col items-center gap-4 sm:flex-row'>
            <div className='relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-primary sm:h-24 sm:w-24'>
              <span className='text-2xl font-bold sm:text-3xl'>{financialHealthScore}</span>
              <span className='absolute bottom-1 text-[10px] text-muted-foreground sm:bottom-2'>
                / 100
              </span>
            </div>
            <div className='text-center sm:text-left'>
              <Badge className={`mb-1 text-xs ${healthScoreMeta.color}`}>
                {healthScoreMeta.badge}
              </Badge>
              <p className='mb-1 text-sm'>{healthScoreMeta.message}</p>
              <Button
                variant='link'
                size='sm'
                className='h-auto p-0 text-xs'
                onClick={() => alert('Recommendations feature coming soon...')}
              >
                View Recommendations
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialHealth;
