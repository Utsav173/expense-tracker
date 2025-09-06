import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { SingleLineEllipsis } from '@/components/ui/ellipsis-components';
import { cn, formatCurrency } from '@/lib/utils';
import { IconName } from '../ui/icon-map';

export interface KpiCardProps {
  title: string;
  value?: number;
  currency: string;
  icon: IconName;
  isLoading: boolean;
  changePercent?: number;
  valuePrefix?: string;
  colorClass?: string;
  description?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  currency,
  icon,
  isLoading,
  changePercent,
  valuePrefix = '',
  colorClass = 'text-foreground',
  description
}) => {
  const getBadgeVariant = (val?: number) => {
    if (val === undefined) return 'default';
    return val >= 0 ? 'success' : 'destructive';
  };

  return (
    <Card className='group border-border bg-card/50 hover:shadow-primary/5 hover:border-primary/20 relative overflow-hidden border backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg'>
      <div className='from-primary/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
      <CardHeader className='relative space-y-0 pb-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1.5'>
            <CardTitle className='text-muted-foreground group-hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors duration-200'>
              <div
                className={cn(
                  'bg-background/50 group-hover:bg-primary/10 rounded-lg p-1.5 transition-all duration-300 group-hover:scale-110',
                  colorClass
                )}
              >
                <Icon name={icon} className='h-4 w-4' />
              </div>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className='text-muted-foreground/80 group-hover:text-muted-foreground text-xs transition-colors duration-200'>
                {description}
              </CardDescription>
            )}
          </div>
          {changePercent !== undefined && (
            <Badge
              variant={getBadgeVariant(changePercent)}
              className='shrink-0 shadow-sm transition-all duration-300 group-hover:shadow-md'
            >
              {changePercent >= 0 ? (
                <Icon name='trendingUp' className='mr-1 h-3 w-3 animate-pulse' />
              ) : (
                <Icon name='trendingDown' className='mr-1 h-3 w-3 animate-pulse' />
              )}
              {changePercent.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='relative pt-0'>
        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='bg-muted/50 h-8 w-3/4 animate-pulse' />
          </div>
        ) : (
          <SingleLineEllipsis
            className={cn(
              'origin-left text-2xl font-bold tracking-tight transition-all duration-300 group-hover:scale-105 sm:text-3xl',
              colorClass
            )}
          >
            {valuePrefix}
            {formatCurrency(value, currency)}
          </SingleLineEllipsis>
        )}
      </CardContent>
    </Card>
  );
};
