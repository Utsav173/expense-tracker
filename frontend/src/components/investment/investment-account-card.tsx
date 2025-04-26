import React from 'react';
import { InvestmentAccount } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash, TrendingUp, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface InvestmentAccountCardProps {
  account: InvestmentAccount & {
    performancePercentage?: number;
    lastUpdated?: string;
  };
  onEdit: (account: InvestmentAccount) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const InvestmentAccountCard: React.FC<InvestmentAccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  className
}) => {
  const performanceColor =
    account.performancePercentage && account.performancePercentage >= 0
      ? 'text-green-500'
      : 'text-red-500';
  const performanceIcon =
    account.performancePercentage && account.performancePercentage >= 0 ? '↑' : '↓';
  const performanceValue = account.performancePercentage
    ? Math.abs(account.performancePercentage)
    : 0;

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-md',
        className
      )}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between'>
          <div className='flex-1 pr-8'>
            <CardTitle className='line-clamp-1 text-xl font-bold'>{account.name}</CardTitle>
            <div className='mt-1.5 flex items-center gap-2'>
              {account.platform && (
                <Badge
                  variant='outline'
                  className='bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium'
                >
                  {account.platform}
                </Badge>
              )}
              <span className='text-muted-foreground text-xs font-medium'>{account.currency}</span>
            </div>
          </div>
          <div className='absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
            <Button
              size='icon'
              variant='ghost'
              className='bg-background/80 hover:bg-background h-8 w-8 rounded-full backdrop-blur-xs'
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit(account);
              }}
            >
              <Edit size={15} />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='bg-background/80 text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full backdrop-blur-xs'
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(account.id);
              }}
            >
              <Trash size={15} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='grow pt-2 pb-4'>
        <div className='space-y-4'>
          <div className='flex items-center gap-1.5'>
            <TrendingUp className='text-primary h-5 w-5' />
            <p className='text-foreground text-2xl font-bold tracking-tight'>
              {formatCurrency(account.balance || 0, account.currency)}
            </p>
          </div>
          <p className='text-muted-foreground mt-0.5 text-xs'>Current Balance</p>

          {account.performancePercentage !== undefined && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Performance</span>
                <span className={cn('font-medium', performanceColor)}>
                  {performanceIcon} {performanceValue}%
                </span>
              </div>
              <Progress
                value={performanceValue}
                className={cn(
                  'h-2',
                  account.performancePercentage >= 0 ? 'bg-green-100' : 'bg-red-100'
                )}
              />
            </div>
          )}

          {account.lastUpdated && (
            <div className='text-muted-foreground text-xs'>
              Last updated: {new Date(account.lastUpdated).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className='mt-auto block p-0'>
        <Link
          href={`/investment/${account.id}`}
          className='bg-primary/10 text-primary hover:bg-primary/20 flex w-full items-center justify-between rounded-b-lg px-4 py-3 text-sm font-medium transition-colors'
        >
          <span>View Details & Holdings</span>
          <ChevronRight size={16} />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default InvestmentAccountCard;
