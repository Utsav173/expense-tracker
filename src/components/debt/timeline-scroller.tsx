'use client';

import React, { memo } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import type { DebtAndInterestAPI } from '@/lib/api/api-types';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface TimelineScrollerProps {
  schedule: DebtAndInterestAPI.AmortizationPayment[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const TimelineTick = memo(
  ({
    payment,
    index,
    isSelected,
    onSelect,
    isLast,
    isSettled
  }: {
    payment: DebtAndInterestAPI.AmortizationPayment;
    index: number;
    isSelected: boolean;
    onSelect: (index: number) => void;
    isLast: boolean;
    isSettled: boolean;
  }) => {
    const getStatusStyles = () => {
      switch (payment.status) {
        case 'settled':
          return {
            icon: CheckCircle,
            bgColor: 'bg-green-600',
            textColor: 'text-green-800 dark:text-green-500',
            borderColor: 'border-green-500',
            shadowColor: 'shadow-green-500/20'
          };
        case 'due':
          return {
            icon: AlertTriangle,
            bgColor: 'bg-red-500',
            textColor: 'text-red-600 dark:text-red-400',
            borderColor: 'border-red-500',
            shadowColor: 'shadow-red-500/20'
          };
        case 'upcoming':
        default:
          return {
            icon: Clock,
            bgColor: 'bg-muted-foreground',
            textColor: 'text-muted-foreground',
            borderColor: 'border-muted-foreground',
            shadowColor: 'shadow-muted-foreground/20'
          };
      }
    };

    const { icon: Icon, bgColor, textColor, borderColor, shadowColor } = getStatusStyles();

    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className='group relative flex cursor-pointer flex-col items-center'
              onClick={() => onSelect(index)}
              role='button'
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(index)}
            >
              {/* Timeline Line Connector */}
              {!isLast && (
                <div className='absolute top-5 left-1/2 z-0 h-0.5 w-full -translate-y-0.5'>
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isSettled ? 'bg-green-600' : 'bg-border'
                    )}
                    style={{ width: 'calc(100% + 2rem)' }}
                  />
                </div>
              )}

              {/* Tick Circle Marker */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200',
                  'bg-background border-2',
                  isSelected
                    ? `scale-110 shadow-lg ${borderColor} ${shadowColor}`
                    : `${borderColor} group-hover:scale-105 group-hover:shadow-md`,
                  'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-200',
                    bgColor
                  )}
                >
                  <Icon className='h-3 w-3 text-white' />
                </div>
              </div>

              {/* Date Label */}
              <div
                className={cn(
                  'mt-3 min-w-0 text-center transition-colors duration-200',
                  isSelected
                    ? `${textColor} font-semibold`
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                <p className='text-xs font-medium whitespace-nowrap'>
                  {format(payment.date, 'MMM yyyy')}
                </p>
                <p className='mt-0.5 text-[10px] opacity-75'>Inst. {index + 1}</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side='top' className='bg-popover border-border'>
            <div className='p-1 text-center'>
              <p className='text-popover-foreground font-semibold'>Installment {index + 1}</p>
              <p className='text-muted-foreground mt-1 text-sm'>{format(payment.date, 'PPP')}</p>
              <div className='mt-2 flex items-center justify-center gap-1'>
                <div className={cn('h-2 w-2 rounded-full', bgColor)} />
                <p className='text-muted-foreground text-xs capitalize'>{payment.status}</p>
              </div>
              <p className='text-popover-foreground mt-2 font-bold'>
                {formatCurrency(payment.installmentAmount)}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
TimelineTick.displayName = 'TimelineTick';

export const TimelineScroller: React.FC<TimelineScrollerProps> = ({
  schedule,
  selectedIndex,
  onSelect
}) => {
  return (
    <Card className='bg-card border-border w-full'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-card-foreground'>Payment Timeline</CardTitle>
        <CardDescription className='text-muted-foreground'>
          Interactive timeline showing all installments. Click any marker to view details.
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-0'>
        <ScrollArea className='w-full'>
          <div
            className='flex items-start px-4 py-6'
            style={{ width: `${Math.max(schedule.length * 80, 100)}px` }}
          >
            {schedule.map((payment, index) => (
              <div
                key={index}
                className='flex-shrink-0'
                style={{
                  width: index === schedule.length - 1 ? '80px' : '80px',
                  marginRight: index === schedule.length - 1 ? '0' : '32px'
                }}
              >
                <TimelineTick
                  payment={payment}
                  index={index}
                  isSelected={selectedIndex === index}
                  onSelect={onSelect}
                  isLast={index === schedule.length - 1}
                  isSettled={payment.status === 'settled'}
                />
              </div>
            ))}
          </div>
          <ScrollBar orientation='horizontal' className='bg-muted h-2' />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
