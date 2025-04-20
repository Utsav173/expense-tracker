'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange, DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears
} from 'date-fns';

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  initialDate?: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  trigger?: React.ReactNode;
  disabled?: DayPickerProps['disabled'] | boolean;
  numberOfMonths?: number;
  align?: 'start' | 'center' | 'end';
}

export function DatePickerWithRange({
  className,
  initialDate,
  onDateChange,
  trigger,
  disabled = false,
  numberOfMonths = 2,
  align = 'end'
}: DatePickerWithRangeProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(initialDate);
  const [isOpen, setIsOpen] = React.useState(false);
  const [month, setMonth] = React.useState(initialDate?.from || new Date());
  const today = new Date();

  React.useEffect(() => {
    setInternalDate(initialDate);
    if (initialDate?.from) {
      setMonth(initialDate.from);
    }
  }, [initialDate]);

  const handleSelect = (range: DateRange | undefined) => {
    setInternalDate(range);
    if (range?.from && range.to) {
      onDateChange(range);
      setIsOpen(false);
    } else if (!range?.from && !range?.to) {
      onDateChange(undefined);
    }
  };

  const presets = [
    { label: 'Today', range: { from: today, to: today } },
    { label: 'Yesterday', range: { from: subDays(today, 1), to: subDays(today, 1) } },
    { label: 'Last 7 days', range: { from: subDays(today, 6), to: today } },
    { label: 'Last 30 days', range: { from: subDays(today, 29), to: today } },
    { label: 'This Month', range: { from: startOfMonth(today), to: endOfMonth(today) } },
    {
      label: 'Last Month',
      range: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1))
      }
    },
    { label: 'This Year', range: { from: startOfYear(today), to: endOfYear(today) } },
    {
      label: 'Last Year',
      range: {
        from: startOfYear(subYears(today, 1)),
        to: endOfYear(subYears(today, 1))
      }
    }
  ];

  const handlePresetClick = (range: DateRange) => {
    setInternalDate(range);
    onDateChange(range);
    setIsOpen(false);
    if (range.to) {
      setMonth(range.to);
    }
  };

  const displayValue = internalDate?.from ? (
    internalDate.to ? (
      <>
        {format(internalDate.from, 'LLL dd, y')} - {format(internalDate.to, 'LLL dd, y')}
      </>
    ) : (
      format(internalDate.from, 'LLL dd, y')
    )
  ) : (
    <span>Pick a date range</span>
  );

  const defaultTrigger = (
    <Button
      id='date'
      variant={'outline'}
      size='sm'
      disabled={disabled === true}
      className={cn(
        'w-full min-w-[240px] justify-start text-left font-normal',
        !internalDate && 'text-muted-foreground',
        className
      )}
    >
      <CalendarIcon className='mr-2 h-4 w-4' />
      <span className='truncate'>{displayValue}</span>
    </Button>
  );

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
        <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
        <PopoverContent className='w-auto p-0' align={align}>
          <div className='flex flex-col sm:flex-row'>
            <div className='hidden border-r border-border p-3 sm:flex sm:flex-col sm:gap-2'>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant='ghost'
                  size='sm'
                  onClick={() => handlePresetClick(preset.range)}
                  className='w-full justify-start whitespace-nowrap px-2'
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode='range'
              defaultMonth={month}
              month={month}
              onMonthChange={setMonth}
              selected={internalDate}
              onSelect={handleSelect}
              numberOfMonths={numberOfMonths}
              disabled={typeof disabled !== 'boolean' ? disabled : undefined}
              pagedNavigation
              fixedWeeks
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
