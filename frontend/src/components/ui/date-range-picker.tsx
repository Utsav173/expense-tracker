'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  initialDate?: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export function DatePickerWithRange({
  className,
  initialDate,
  onDateChange,
  trigger,
  disabled
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(initialDate);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onDateChange(range);
    if (range?.from && range.to) {
      setIsOpen(false);
    }
  };

  const defaultTrigger = (
    <Button
      id='date'
      variant={'outline'}
      size='sm'
      disabled={disabled}
      className={cn(
        'w-[240px] justify-start text-left font-normal',
        !date && 'text-muted-foreground',
        className
      )}
    >
      <CalendarIcon className='mr-2 h-4 w-4' />
      {date?.from ? (
        date.to ? (
          <>
            {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
          </>
        ) : (
          format(date.from, 'LLL dd, y')
        )
      ) : (
        <span>Pick a date range</span>
      )}
    </Button>
  );

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
        <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='end'>
          <Calendar
            initialFocus
            mode='range'
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
