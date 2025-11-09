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

const DotPattern = () => (
  <div
    className='bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)]/[10] absolute inset-0 mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-size-[16px_16px] opacity-40 transition-transform duration-500 ease-out group-hover:scale-105'
    aria-hidden='true'
  />
);

const GhostIcon = ({ name }: { name: IconName }) => (
  <Icon
    name={name}
    className='text-primary/5 absolute -right-4 -bottom-4 h-24 w-24 opacity-20 group-hover:opacity-30'
    aria-hidden='true'
  />
);

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
    <Card className='group hover:shadow-primary/10 relative overflow-hidden rounded-2xl border-none shadow-lg transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-2xl'>
      <div className='absolute inset-0 bg-linear-to-br from-transparent via-white/5 to-white/20 opacity-100 transition-all duration-300 dark:via-black/5 dark:to-black/20' />
      <DotPattern />
      <GhostIcon name={icon} />

      <CardHeader className='relative z-10 space-y-0 pb-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1.5'>
            <CardTitle className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
              <div
                className={cn(
                  'bg-background/70 shadow-inner-sm group-hover:bg-primary/10 rounded-lg p-1.5 transition-all duration-300 group-hover:scale-110',
                  colorClass
                )}
              >
                <Icon name={icon} className='h-4 w-4' />
              </div>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className='text-muted-foreground/80 text-xs'>
                {description}
              </CardDescription>
            )}
          </div>
          {changePercent !== undefined && (
            <Badge
              variant={getBadgeVariant(changePercent)}
              className='shrink-0 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:brightness-110'
            >
              {changePercent >= 0 ? (
                <Icon name='trendingUp' className='mr-1 h-3 w-3' />
              ) : (
                <Icon name='trendingDown' className='mr-1 h-3 w-3' />
              )}
              {changePercent.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='relative z-10 pt-0'>
        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-3/4 animate-pulse' />
          </div>
        ) : (
          <SingleLineEllipsis
            className={cn(
              'origin-left text-3xl font-bold tracking-tight transition-all duration-300 group-hover:scale-105 sm:text-4xl',
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
