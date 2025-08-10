'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DayPickerProps, DropdownNavProps, DropdownProps } from 'react-day-picker';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  disabled?: boolean | DayPickerProps['disabled'];
  buttonDisabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  buttonDisabled
}) => {
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  const handleDateSelect = (date: Date | undefined): void => {
    if (date) {
      setSelectedDate(date);
      onChange?.(date);
      setOpenPopover(false);
    }
  };

  const handleCalendarChange = (
    value: string | number,
    onChangeEvent: React.ChangeEventHandler<HTMLSelectElement>
  ) => {
    const syntheticEvent = {
      target: { value: String(value) }
    } as React.ChangeEvent<HTMLSelectElement>;
    onChangeEvent(syntheticEvent);
  };

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover} modal>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value ? format(value, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={selectedDate}
          onSelect={handleDateSelect}
          autoFocus
          className='rounded-md border p-2'
          classNames={{
            month_caption: 'mx-0'
          }}
          captionLayout='dropdown'
          defaultMonth={selectedDate || new Date()}
          disabled={disabled}
          startMonth={new Date(1980, 0)}
          endMonth={new Date(2100, 11)}
          hideNavigation
          components={{
            DropdownNav: (props: DropdownNavProps) => {
              return <div className='flex w-full items-center gap-2'>{props.children}</div>;
            },
            Dropdown: (props: DropdownProps) => {
              return (
                <Select
                  value={String(props.value)}
                  onValueChange={(value) => {
                    if (props.onChange) {
                      handleCalendarChange(value, props.onChange);
                    }
                  }}
                >
                  <SelectTrigger className='h-8 w-fit font-medium first:grow'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='max-h-[min(26rem,var(--radix-select-content-available-height))]'>
                    {props.options?.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
