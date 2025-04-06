'use client';

import { useState, useEffect } from 'react';
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
  format
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  className?: string;
  trigger?: React.ReactNode;
}

const DateRangePicker = ({ dateRange, setDateRange, className, trigger }: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(dateRange?.from || new Date()); // Month for calendar display

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

  // for display current selected range.
  useEffect(() => {
    if (dateRange?.from) {
      setMonth(dateRange.from);
    }
  }, [dateRange]);

  const handleDateSelect = (date: DateRange | undefined) => {
    setDateRange(date);
    if (date?.from && date.to) {
      setOpen(false);
    }
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
              !dateRange && 'text-muted-foreground',
              className
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {dateRange?.from ? (
              dateRange.to ? (
                <p className='truncate'>
                  {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                </p>
              ) : (
                <p> {format(dateRange.from, 'LLL dd, y')} </p>
              )
            ) : (
              <p>Pick a date</p>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='center' alignOffset={0}>
        <div>
          <div className='flex flex-col sm:flex-row'>
            <div className='shrink-0 border-b border-border py-4 max-sm:hidden sm:w-32 sm:border-b-0 sm:border-r'>
              <div className='flex flex-col px-2'>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start'
                    onClick={() => {
                      setDateRange(preset.range);
                      setMonth(preset.range.to!);
                      setOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className='w-full'>
              <Calendar
                mode='range'
                selected={dateRange}
                onSelect={handleDateSelect}
                month={month}
                onMonthChange={setMonth}
                className='rounded-md border'
                disabled={[{ after: today }]}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
