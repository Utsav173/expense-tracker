'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { Payment } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface TimelineScrollerProps {
  schedule: Payment[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const TimelineScroller: React.FC<TimelineScrollerProps> = ({
  schedule,
  selectedIndex,
  onSelect
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const element = timelineItemRefs.current[selectedIndex];
    const container = scrollContainerRef.current;

    if (element && container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const elementCenter = element.offsetLeft + element.offsetWidth / 2;
      const containerCenter = container.offsetWidth / 2;
      const scrollPosition = elementCenter - containerCenter;

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  const getStatusColor = (status: Payment['status'], isSelected: boolean, isHovered: boolean) => {
    const baseClasses = 'transition-all duration-200 ease-in-out';

    if (isSelected) {
      switch (status) {
        case 'settled':
          return `${baseClasses} border-green-600 bg-green-600 shadow-lg shadow-green-200 scale-110`;
        case 'due':
          return `${baseClasses} border-red-600 bg-red-600 shadow-lg shadow-red-200 scale-110`;
        case 'upcoming':
          return `${baseClasses} border-primary bg-primary shadow-lg shadow-primary/30 scale-110`;
        default:
          return `${baseClasses} border-primary bg-primary shadow-lg shadow-primary/30 scale-110`;
      }
    }

    if (isHovered) {
      switch (status) {
        case 'settled':
          return `${baseClasses} border-green-500 bg-green-100 scale-105`;
        case 'due':
          return `${baseClasses} border-red-500 bg-red-100 scale-105`;
        case 'upcoming':
          return `${baseClasses} border-primary bg-primary/10 scale-105`;
        default:
          return `${baseClasses} border-muted-foreground bg-muted scale-105`;
      }
    }

    switch (status) {
      case 'settled':
        return `${baseClasses} border-green-500 bg-green-500/20`;
      case 'due':
        return `${baseClasses} border-red-500 bg-red-500/20`;
      case 'upcoming':
        return `${baseClasses} border-muted-foreground bg-background`;
      default:
        return `${baseClasses} border-muted-foreground bg-background`;
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'settled':
        return (
          <Badge variant='default' className='bg-green-500 text-xs hover:bg-green-600'>
            Paid
          </Badge>
        );
      case 'due':
        return (
          <Badge variant='destructive' className='text-xs'>
            Due
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant='outline' className='text-xs'>
            Upcoming
          </Badge>
        );
      default:
        return null;
    }
  };

  const progressPercentage =
    schedule.length > 1 ? (selectedIndex / (schedule.length - 1)) * 100 : 100;
  const settledCount = schedule.filter(
    (_, i) => i <= selectedIndex && schedule[i].status === 'settled'
  ).length;
  const completionRate = schedule.length > 0 ? (settledCount / schedule.length) * 100 : 0;

  return (
    <div className='space-y-4'>
      {/* Progress Summary */}
      <div className='flex items-center justify-between text-sm'>
        <div className='flex items-center gap-4'>
          <span className='text-muted-foreground'>
            Installment <span className='text-foreground font-semibold'>{selectedIndex + 1}</span>{' '}
            of {schedule.length}
          </span>
          {schedule[selectedIndex] && (
            <span className='text-muted-foreground'>
              Due:{' '}
              <span className='text-foreground font-medium'>
                {format(schedule[selectedIndex].date, 'MMM d, yyyy')}
              </span>
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {getStatusBadge(schedule[selectedIndex]?.status)}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className='relative'>
        {/* Background and Progress Lines */}
        <div className='bg-border absolute top-6 right-6 left-6 h-0.5 rounded-full' />
        <div
          className='from-primary to-primary/60 absolute top-6 left-6 h-0.5 rounded-full bg-gradient-to-r transition-all duration-500 ease-out'
          style={{ width: `calc(${progressPercentage}% * (100% - 48px) / 100)` }}
        />

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className='relative overflow-x-auto pb-2'
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className='flex min-w-max items-start gap-1 px-6 py-2'>
            {schedule.map((payment, index) => {
              const isSelected = selectedIndex === index;
              const isHovered = hoveredIndex === index;

              return (
                <div key={index} className='group flex min-w-[80px] flex-col items-center'>
                  {/* Payment Amount (appears on hover/selection) */}
                  <div
                    className={cn(
                      'mb-2 rounded-md px-2 py-1 text-xs font-medium transition-all duration-200',
                      isSelected || isHovered
                        ? 'bg-muted text-muted-foreground translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-2 opacity-0'
                    )}
                  >
                    {formatCurrency(payment.installmentAmount)}
                  </div>

                  {/* Timeline Marker */}
                  <button
                    ref={(el) => {
                      timelineItemRefs.current[index] = el;
                    }}
                    onClick={() => onSelect(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      'focus:ring-primary focus:ring-offset-background relative flex h-3 w-3 items-center justify-center rounded-full border-2 focus:ring-2 focus:ring-offset-2 focus:outline-none',
                      getStatusColor(payment.status, isSelected, isHovered)
                    )}
                    aria-label={`Installment ${index + 1}: ${formatCurrency(payment.installmentAmount)} due ${format(payment.date, 'MMM d, yyyy')}`}
                  >
                    {/* Inner dot for selected state */}
                    {isSelected && <div className='bg-background h-1 w-1 rounded-full' />}
                  </button>

                  {/* Installment Number */}
                  <div
                    className={cn(
                      'mt-2 text-xs transition-all duration-200',
                      isSelected
                        ? 'text-primary font-bold'
                        : isHovered
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Navigation Hint */}
        {schedule.length > 5 && (
          <div className='mt-2 flex justify-center'>
            <span className='text-muted-foreground text-xs'>
              Scroll horizontally or click to navigate • {Math.round(completionRate)}% completed
            </span>
          </div>
        )}
      </div>

      {/* Selected Payment Details */}
      {schedule[selectedIndex] && (
        <div className='bg-muted/30 grid grid-cols-2 gap-4 rounded-lg border p-3'>
          <div className='space-y-1'>
            <div className='text-muted-foreground text-xs'>Principal</div>
            <div className='font-medium'>
              {formatCurrency(schedule[selectedIndex].principalForPeriod)}
            </div>
          </div>
          <div className='space-y-1'>
            <div className='text-muted-foreground text-xs'>Interest</div>
            <div className='font-medium'>
              {formatCurrency(schedule[selectedIndex].interestForPeriod)}
            </div>
          </div>
          <div className='space-y-1'>
            <div className='text-muted-foreground text-xs'>Remaining Balance</div>
            <div className='font-medium'>
              {formatCurrency(schedule[selectedIndex].remainingPrincipal)}
            </div>
          </div>
          <div className='space-y-1'>
            <div className='text-muted-foreground text-xs'>Due Date</div>
            <div className='font-medium'>{format(schedule[selectedIndex].date, 'MMM d, yyyy')}</div>
          </div>
        </div>
      )}
    </div>
  );
};
