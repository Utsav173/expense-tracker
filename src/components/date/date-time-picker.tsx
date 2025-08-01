'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DayPickerProps } from 'react-day-picker';

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  disabled?: boolean | DayPickerProps['disabled'];
  buttonDisabled?: boolean;
  captionLayout?: DayPickerProps['captionLayout'];

  // New props for enhanced functionality
  placeholder?: string;
  format?: string;
  use24Hour?: boolean;
  minuteStep?: number;
  minDate?: Date;
  maxDate?: Date;
  showTimeIcon?: boolean;
  className?: string;
  popoverClassName?: string;
  calendarClassName?: string;
  timeClassName?: string;
  closeOnSelect?: boolean;
  showSeconds?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

type TimeType = 'hour' | 'minute' | 'second' | 'ampm';

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  disabled = false,
  buttonDisabled = false,
  captionLayout,
  placeholder,
  format: dateFormat = 'MM/dd/yyyy hh:mm aa',
  use24Hour = false,
  minuteStep = 5,
  minDate,
  maxDate,
  showTimeIcon = false,
  className,
  popoverClassName,
  calendarClassName,
  timeClassName,
  closeOnSelect = false,
  showSeconds = false,
  autoFocus = true,
  required = false,
  name,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => value || new Date());

  // Memoized computed values
  const displayFormat = useMemo(() => {
    if (dateFormat) return dateFormat;
    if (use24Hour) {
      return showSeconds ? 'MM/dd/yyyy HH:mm:ss' : 'MM/dd/yyyy HH:mm';
    }
    return showSeconds ? 'MM/dd/yyyy hh:mm:ss aa' : 'MM/dd/yyyy hh:mm aa';
  }, [dateFormat, use24Hour, showSeconds]);

  const placeholderText = useMemo(() => {
    if (placeholder) return placeholder;
    if (use24Hour) {
      return showSeconds ? 'MM/DD/YYYY HH:MM:SS' : 'MM/DD/YYYY HH:MM';
    }
    return showSeconds ? 'MM/DD/YYYY HH:MM:SS AA' : 'MM/DD/YYYY HH:MM AA';
  }, [placeholder, use24Hour, showSeconds]);

  // Generate time options with memoization
  const timeOptions = useMemo(() => {
    const hours = use24Hour
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => i + 1);

    const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);

    const seconds = showSeconds ? Array.from({ length: 60 }, (_, i) => i) : [];

    return { hours, minutes, seconds };
  }, [use24Hour, minuteStep, showSeconds]);

  // Sync with external value changes
  useEffect(() => {
    if (value && value.getTime() !== selectedDate.getTime()) {
      setSelectedDate(value);
    }
  }, [value, selectedDate]);

  // Optimized date selection handler
  const handleDateSelect = useCallback(
    (date: Date | undefined): void => {
      if (!date) return;

      // Preserve time from current selection
      const newDate = new Date(date);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      if (showSeconds) {
        newDate.setSeconds(selectedDate.getSeconds());
      }

      setSelectedDate(newDate);
      onChange?.(newDate);

      if (closeOnSelect && !showTimeIcon) {
        setOpenPopover(false);
      }
    },
    [selectedDate, onChange, closeOnSelect, showTimeIcon, showSeconds]
  );

  // Optimized time change handler with validation
  const handleTimeChange = useCallback(
    (type: TimeType, newValue: string): void => {
      const newDate = new Date(selectedDate);
      const numValue = parseInt(newValue, 10);

      switch (type) {
        case 'hour':
          if (use24Hour) {
            newDate.setHours(numValue);
          } else {
            const currentHours = newDate.getHours();
            const isPM = currentHours >= 12;
            const hour12 = numValue === 12 ? 0 : numValue;
            newDate.setHours(isPM ? hour12 + 12 : hour12);
          }
          break;
        case 'minute':
          newDate.setMinutes(numValue);
          break;
        case 'second':
          if (showSeconds) {
            newDate.setSeconds(numValue);
          }
          break;
        case 'ampm':
          if (!use24Hour) {
            const hours = newDate.getHours();
            if (newValue === 'AM' && hours >= 12) {
              newDate.setHours(hours - 12);
            } else if (newValue === 'PM' && hours < 12) {
              newDate.setHours(hours + 12);
            }
          }
          break;
      }

      // Validate against min/max dates
      if (minDate && newDate < minDate) return;
      if (maxDate && newDate > maxDate) return;

      setSelectedDate(newDate);
      onChange?.(newDate);
    },
    [selectedDate, onChange, use24Hour, showSeconds, minDate, maxDate]
  );

  // Get current time values for highlighting
  const currentTimeValues = useMemo(() => {
    const hours = selectedDate.getHours();
    return {
      hour: use24Hour ? hours : hours % 12 || 12,
      minute: selectedDate.getMinutes(),
      second: selectedDate.getSeconds(),
      ampm: hours >= 12 ? 'PM' : 'AM'
    };
  }, [selectedDate, use24Hour]);

  // Close popover on escape key
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpenPopover(false);
    }
  }, []);

  // Render time scroll area component
  const TimeScrollArea = ({
    values,
    currentValue,
    type,
    label
  }: {
    values: number[] | string[];
    currentValue: number | string;
    type: TimeType;
    label: string;
  }) => (
    <ScrollArea className='w-16 sm:w-auto' aria-label={label}>
      <div className='flex p-2 sm:flex-col'>
        {values.map((val) => {
          const displayValue =
            typeof val === 'number'
              ? (type === 'hour' && !use24Hour && val === 0 ? 12 : val).toString().padStart(2, '0')
              : val;
          const isSelected = val === currentValue;

          return (
            <Button
              key={val}
              size='icon'
              variant={isSelected ? 'default' : 'ghost'}
              className='aspect-square shrink-0 text-xs sm:w-full'
              onClick={() => handleTimeChange(type, val.toString())}
              aria-pressed={isSelected}
              aria-label={`${label} ${displayValue}`}
            >
              {displayValue}
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation='horizontal' className='sm:hidden' />
    </ScrollArea>
  );

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover} modal>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            className
          )}
          disabled={!!buttonDisabled}
          onKeyDown={handleKeyDown}
          id={id}
          name={name}
          aria-label={ariaLabel || 'Select date and time'}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          aria-expanded={openPopover}
          aria-haspopup='dialog'
        >
          {selectedDate ? (
            <span className='truncate'>{format(selectedDate, displayFormat)}</span>
          ) : (
            <span className='text-muted-foreground'>{placeholderText}</span>
          )}
          <div className='ml-auto flex items-center gap-1'>
            {showTimeIcon && <Clock className='h-4 w-4 opacity-50' />}
            <CalendarIcon className='h-4 w-4 opacity-50' />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className={cn('w-auto p-0', popoverClassName)} onKeyDown={handleKeyDown}>
        <div className='relative sm:flex'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={disabled}
            captionLayout={captionLayout}
            autoFocus={autoFocus}
            fromDate={minDate}
            toDate={maxDate}
            className={calendarClassName}
          />

          <div
            className={cn(
              'flex flex-col divide-y border-l sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0',
              timeClassName
            )}
          >
            {/* Hours */}
            <TimeScrollArea
              values={timeOptions.hours}
              currentValue={currentTimeValues.hour}
              type='hour'
              label='Hours'
            />

            {/* Minutes */}
            <TimeScrollArea
              values={timeOptions.minutes}
              currentValue={currentTimeValues.minute}
              type='minute'
              label='Minutes'
            />

            {/* Seconds (if enabled) */}
            {showSeconds && (
              <TimeScrollArea
                values={timeOptions.seconds}
                currentValue={currentTimeValues.second}
                type='second'
                label='Seconds'
              />
            )}

            {/* AM/PM (if not 24-hour) */}
            {!use24Hour && (
              <ScrollArea className='w-16 sm:w-auto' aria-label='AM/PM'>
                <div className='flex p-2 sm:flex-col'>
                  {['AM', 'PM'].map((ampm) => (
                    <Button
                      key={ampm}
                      size='icon'
                      variant={currentTimeValues.ampm === ampm ? 'default' : 'ghost'}
                      className='aspect-square shrink-0 text-xs sm:w-full'
                      onClick={() => handleTimeChange('ampm', ampm)}
                      aria-pressed={currentTimeValues.ampm === ampm}
                      aria-label={ampm}
                    >
                      {ampm}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateTimePicker;
