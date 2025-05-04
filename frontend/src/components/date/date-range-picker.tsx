'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
  format,
  isBefore,
  isEqual
} from 'date-fns';
import { DateRange, DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  className?: string;
  trigger?: React.ReactNode;
  disabled?: DayPickerProps['disabled'];
}

const DateRangePicker = ({
  dateRange,
  setDateRange,
  className,
  disabled = false,
  trigger
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(dateRange?.from || new Date());

  const [selectionState, setSelectionState] = useState<'from' | 'to' | 'complete'>('from');

  const [localRange, setLocalRange] = useState<DateRange | undefined>(dateRange);

  const today = new Date();
  const presets = [
    { label: 'Today', range: { from: today, to: today } },
    { label: 'Yesterday', range: { from: subDays(today, 1), to: subDays(today, 1) } },
    { label: 'Last 7 days', range: { from: subDays(today, 6), to: today } },
    { label: 'Last 30 days', range: { from: subDays(today, 29), to: today } },
    { label: 'Month to date', range: { from: startOfMonth(today), to: today } },
    {
      label: 'Last month',
      range: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1))
      }
    },
    { label: 'Year to date', range: { from: startOfYear(today), to: today } },
    {
      label: 'Last year',
      range: {
        from: startOfYear(subYears(today, 1)),
        to: endOfYear(subYears(today, 1))
      }
    }
  ];

  useEffect(() => {
    if (dateRange?.from) {
      setMonth(dateRange.from);
    }
  }, [dateRange]);

  useEffect(() => {
    setLocalRange(dateRange);
  }, [dateRange]);

  useEffect(() => {
    if (!open && localRange?.from && localRange?.to) {
      setSelectionState('complete');
    } else if (!open) {
      setSelectionState('from');
    }
  }, [open, localRange]);

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      setLocalRange(undefined);
      setDateRange(undefined);
      setSelectionState('from');
      return;
    }

    if (selectionState === 'from' && range.from) {
      setLocalRange({ from: range.from, to: undefined });
      setSelectionState('to');
      return;
    }

    if (selectionState === 'to' && range.from && range.to) {
      const orderedRange = createOrderedDateRange(range.from, range.to);
      setLocalRange(orderedRange);
      setDateRange(orderedRange);
      setSelectionState('complete');
      setOpen(false);
      return;
    }

    if (range.from && range.to && isEqual(range.from, range.to)) {
      setLocalRange(range);
      setDateRange(range);
      setSelectionState('complete');
      setOpen(false);
    }
  };

  const createOrderedDateRange = (date1: Date, date2: Date): DateRange => {
    const startDate = new Date(date1);
    const endDate = new Date(date2);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return isBefore(startDate, endDate)
      ? { from: startDate, to: endDate }
      : { from: endDate, to: startDate };
  };

  const handlePresetSelect = (preset: { range: DateRange }) => {
    setDateRange(preset.range);
    setLocalRange(preset.range);
    setMonth(preset.range.to || preset.range.from || new Date());
    setSelectionState('complete');
    setOpen(false);
  };

  const renderDateDisplay = () => {
    if (!localRange?.from) {
      return <p>Pick a date</p>;
    }

    if (localRange.to) {
      return (
        <p className='truncate'>
          {format(localRange.from, 'LLL dd, y')} - {format(localRange.to, 'LLL dd, y')}
        </p>
      );
    }

    return <p>{format(localRange.from, 'LLL dd, y')}</p>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            id='date'
            variant='outline'
            className={cn(
              'w-full justify-start text-left font-normal',
              !localRange && 'text-muted-foreground',
              className
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {renderDateDisplay()}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='center' alignOffset={0}>
        <div>
          <div className='flex flex-col sm:flex-row'>
            {/* Presets sidebar */}
            <div className='border-border shrink-0 border-b py-4 max-sm:hidden sm:w-32 sm:border-r sm:border-b-0'>
              <div className='flex flex-col px-2'>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start'
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            {/* Calendar */}
            <div className='w-full'>
              <Calendar
                mode='range'
                selected={localRange}
                onSelect={handleDateSelect}
                month={month}
                onMonthChange={setMonth}
                className='rounded-md border'
                disabled={typeof disabled !== 'boolean' ? disabled : [{ after: today }]}
                numberOfMonths={1}
                classNames={{
                  selected: 'bg-primary/10 text-primary-foreground',
                  range_start: 'rounded-l-full',
                  range_end: 'rounded-r-full',
                  day: 'relative before:absolute before:inset-y-px before:inset-x-0 [&.range-start:not(.range-end):before]:bg-linear-to-r before:from-transparent before:from-50% before:to-accent before:to-50% [&.range-end:not(.range-start):before]:bg-linear-to-l',
                  day_button:
                    'rounded-full group-[.range-start:not(.range-end)]:rounded-e-full group-[.range-end:not(.range-start)]:rounded-s-full'
                }}
                autoFocus
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
