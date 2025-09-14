'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, setMonth as setMonthFns, setYear as setYearFns } from 'date-fns';
import { cn } from '@/lib/utils';
import { DayPickerProps, CaptionLabelProps } from 'react-day-picker';
import { Icon } from '../ui/icon';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

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
  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date((value || new Date()).getFullYear(), (value || new Date()).getMonth(), 1)
  );

  // Normalize min/max bounds
  const [minBound, maxBound] = useMemo(() => {
    if (minDate && maxDate && minDate > maxDate) return [maxDate, minDate];
    return [minDate, maxDate];
  }, [minDate, maxDate]);

  // Month/year dropdown data
  const validYears = useMemo(() => {
    const baseYear = viewMonth.getFullYear();
    const fromYear = minBound ? minBound.getFullYear() : baseYear - 50;
    const toYear = maxBound ? maxBound.getFullYear() : baseYear + 10;
    const years: number[] = [];
    for (let y = fromYear; y <= toYear; y++) years.push(y);
    return years;
  }, [minBound, maxBound, viewMonth]);

  const validMonths = useMemo(() => {
    const y = viewMonth.getFullYear();
    let startIdx = 0;
    let endIdx = 11;
    if (minBound && y === minBound.getFullYear()) startIdx = minBound.getMonth();
    if (maxBound && y === maxBound.getFullYear()) endIdx = maxBound.getMonth();
    return Array.from({ length: 12 }, (_, i) => i).filter((i) => i >= startIdx && i <= endIdx);
  }, [viewMonth, minBound, maxBound]);

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

    const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep);
    const seconds = showSeconds ? Array.from({ length: 60 }, (_, i) => i) : [];
    return { hours, minutes, seconds };
  }, [use24Hour, minuteStep, showSeconds]);

  // Sync with external value changes
  useEffect(() => {
    if (value && value.getTime() !== selectedDate.getTime()) {
      setSelectedDate(value);
      setViewMonth(new Date(value.getFullYear(), value.getMonth(), 1));
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

  // Month/Year dropdown handlers
  const handleMonthDropdownChange = useCallback(
    (monthIndex: string) => {
      setViewMonth(setMonthFns(viewMonth, parseInt(monthIndex, 10)));
    },
    [viewMonth]
  );

  const handleYearDropdownChange = useCallback(
    (year: string) => {
      const y = parseInt(year, 10);
      let next = setYearFns(viewMonth, y);

      // Clamp to valid month range if needed
      const startIdx = minBound && y === minBound.getFullYear() ? minBound.getMonth() : 0;
      const endIdx = maxBound && y === maxBound.getFullYear() ? maxBound.getMonth() : 11;
      const m = next.getMonth();
      if (m < startIdx) next = setMonthFns(next, startIdx);
      if (m > endIdx) next = setMonthFns(next, endIdx);

      setViewMonth(next);
    },
    [viewMonth, minBound, maxBound]
  );

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
    <div
      className='flex overflow-scroll max-sm:mx-auto max-sm:w-[250px] sm:ml-2 sm:flex-col'
      aria-label={label}
    >
      {values.map((val) => {
        const displayValue =
          typeof val === 'number'
            ? (type === 'hour' && !use24Hour && val === 0 ? 12 : val).toString().padStart(2, '0')
            : val;
        const isSelected = val === currentValue;

        return (
          <Button
            key={val as React.Key}
            size='icon'
            variant={isSelected ? 'default' : 'ghost'}
            className='aspect-square shrink-0 text-xs sm:w-full'
            onClick={() => handleTimeChange(type, String(val))}
            aria-pressed={isSelected}
            aria-label={`${label} ${displayValue}`}
          >
            {displayValue}
          </Button>
        );
      })}
    </div>
  );

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover} modal>
      <PopoverTrigger asChild>
        <div className='relative w-full'>
          <Input
            type='text'
            id={id}
            name={name}
            value={selectedDate ? format(selectedDate, displayFormat) : ''}
            placeholder={placeholderText}
            readOnly
            disabled={!!buttonDisabled}
            onKeyDown={handleKeyDown}
            aria-label={ariaLabel || 'Select date and time'}
            aria-describedby={ariaDescribedBy}
            aria-required={required}
            aria-expanded={openPopover}
            aria-haspopup='dialog'
            className={cn('w-full cursor-pointer pr-10', className)}
          />
          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
            {showTimeIcon && <Icon name='clock' className='mr-1 h-4 w-4 opacity-50' />}
            <Icon name='calendar' className='h-4 w-4 opacity-50' />
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          'w-full max-w-[95vw] p-0 sm:w-auto',
          'max-h-[80vh] overflow-y-auto',
          popoverClassName
        )}
        onKeyDown={handleKeyDown}
      >
        <div className='relative sm:flex sm:items-center'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={disabled}
            captionLayout={captionLayout}
            autoFocus={autoFocus}
            fromDate={minBound}
            toDate={maxBound}
            month={viewMonth}
            onMonthChange={setViewMonth}
            // Remove arrow navigation and use dropdowns
            className={cn('p-2', calendarClassName)}
            classNames={{
              nav: 'hidden',
              month_caption: 'flex justify-start px-1 mx-auto'
            }}
            components={{
              CaptionLabel: (props: CaptionLabelProps) => (
                <CustomCaptionLabel
                  {...props}
                  displayMonth={viewMonth}
                  validYears={validYears}
                  validMonths={validMonths}
                  onMonthChange={handleMonthDropdownChange}
                  onYearChange={handleYearDropdownChange}
                />
              )
            }}
          />

          <div
            className={cn(
              'flex w-full flex-col divide-y border-l sm:my-auto sm:max-h-[280px] sm:flex-row sm:divide-x sm:divide-y-0',
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

            {/* Seconds */}
            {showSeconds && (
              <TimeScrollArea
                values={timeOptions.seconds}
                currentValue={currentTimeValues.second}
                type='second'
                label='Seconds'
              />
            )}

            {/* AM/PM */}
            {!use24Hour && (
              <ScrollArea
                className='w-16 px-2 max-sm:mx-auto max-sm:w-[250px] max-sm:px-0 max-sm:py-2'
                aria-label='AM/PM'
              >
                <div className='flex sm:flex-col'>
                  {['AM', 'PM'].map((ampm) => (
                    <Button
                      key={ampm}
                      size='icon'
                      variant={currentTimeValues.ampm === ampm ? 'default' : 'ghost'}
                      className='m-auto aspect-square p-2 text-xs sm:w-full'
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

// Custom caption with Month/Year dropdowns
function CustomCaptionLabel({
  displayMonth,
  validYears,
  validMonths,
  onMonthChange,
  onYearChange
}: {
  displayMonth: Date;
  validYears: number[];
  validMonths: number[];
  onMonthChange: (monthIndex: string) => void;
  onYearChange: (year: string) => void;
} & CaptionLabelProps) {
  return (
    <div className='flex items-center gap-2'>
      <Select value={displayMonth.getMonth().toString()} onValueChange={onMonthChange}>
        <SelectTrigger className='h-8 w-[120px] bg-transparent text-sm font-medium'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, idx) => (
            <SelectItem key={idx} value={idx.toString()} disabled={!validMonths.includes(idx)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={displayMonth.getFullYear().toString()} onValueChange={onYearChange}>
        <SelectTrigger className='h-8 w-[90px] bg-transparent text-sm font-medium'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='max-h-[200px]'>
          {validYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
