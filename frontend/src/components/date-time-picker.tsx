'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  disabled?: boolean;
}

type TimeType = 'hour' | 'minute' | 'ampm';
type AMPM = 'AM' | 'PM';

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, disabled = false }) => {
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined): void => {
    if (date) {
      setSelectedDate(date);
      onChange?.(date);
    }
  };

  const handleTimeChange = (type: TimeType, value: string): void => {
    const newDate = new Date(selectedDate);
    if (type === 'hour') {
      const hour = parseInt(value, 10);
      newDate.setHours(newDate.getHours() >= 12 ? hour + 12 : hour);
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === 'ampm') {
      const hours = newDate.getHours();
      if (value === 'AM' && hours >= 12) {
        newDate.setHours(hours - 12);
      } else if (value === 'PM' && hours < 12) {
        newDate.setHours(hours + 12);
      }
    }
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover} modal>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full pl-3 text-left font-normal',
            !selectedDate && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          {selectedDate ? format(selectedDate, 'MM/dd/yyyy hh:mm aa') : 'MM/DD/YYYY hh:mm aa'}
          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <div className='relative z-[120] sm:flex'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className='flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0'>
            <ScrollArea className='w-64 sm:w-auto'>
              <div className='flex p-2 sm:flex-col'>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                  <Button
                    key={hour}
                    size='icon'
                    variant={selectedDate.getHours() % 12 === hour % 12 ? 'default' : 'ghost'}
                    className='aspect-square shrink-0 sm:w-full'
                    onClick={() => handleTimeChange('hour', hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation='horizontal' className='sm:hidden' />
            </ScrollArea>
            <ScrollArea className='w-64 sm:w-auto'>
              <div className='flex p-2 sm:flex-col'>
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size='icon'
                    variant={selectedDate.getMinutes() === minute ? 'default' : 'ghost'}
                    className='aspect-square shrink-0 sm:w-full'
                    onClick={() => handleTimeChange('minute', minute.toString())}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation='horizontal' className='sm:hidden' />
            </ScrollArea>
            <ScrollArea>
              <div className='flex p-2 sm:flex-col'>
                {['AM', 'PM'].map((ampm) => (
                  <Button
                    key={ampm}
                    size='icon'
                    variant={
                      (ampm === 'AM' && selectedDate.getHours() < 12) ||
                      (ampm === 'PM' && selectedDate.getHours() >= 12)
                        ? 'default'
                        : 'ghost'
                    }
                    className='aspect-square shrink-0 sm:w-full'
                    onClick={() => handleTimeChange('ampm', ampm)}
                  >
                    {ampm}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateTimePicker;
