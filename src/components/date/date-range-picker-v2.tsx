'use client';

import { useId, useState, useEffect, useMemo, useRef } from 'react';
import {
  format,
  isValid,
  differenceInDays,
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfYear,
  startOfYear,
  isAfter,
  isBefore,
  addYears,
  subYears,
  startOfMonth as dateFnsStartOfMonth,
  endOfMonth as dateFnsEndOfMonth,
  subDays,
  startOfMonth,
  endOfMonth,
  setMonth as setMonthFns,
  setYear as setYearFns
} from 'date-fns';
import { DateRange, CaptionLabelProps, MonthGridProps, DayPickerProps } from 'react-day-picker';
import type { Dispatch, SetStateAction } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icon } from '../ui/icon';
import { now } from 'lodash';

interface DateRangePickerV2Props {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  disabledDates?: Date[];
  placeholder?: string;
  closeOnComplete?: boolean;
  minDaysBetween?: number;
  dateFormat?: string;
  defaultMonth?: Date;
  startYearOffset?: number;
  endYearOffset?: number;
  noLabel?: boolean;
  buttonClassName?: string;
  hideCloseButton?: boolean;
  isOnModal?: boolean;
  showAllOption?: boolean;
}

const defaultProps: Partial<DateRangePickerV2Props> = {
  label: 'Date range picker',
  placeholder: `${format(startOfMonth(now()), 'LLL dd, y')} - ${format(endOfMonth(now()), 'LLL dd, y')}`,
  closeOnComplete: true,
  minDaysBetween: 1,
  dateFormat: 'LLL dd, y',
  disabled: false,
  disabledDates: [],
  startYearOffset: 50,
  endYearOffset: 10,
  noLabel: false,
  buttonClassName: '',
  showAllOption: true
};

function getStartOfMonth(date: Date): Date {
  return dateFnsStartOfMonth(date);
}

function getEndOfMonth(date: Date): Date {
  return dateFnsEndOfMonth(date);
}

export default function DateRangePickerV2(props: DateRangePickerV2Props) {
  const mergedProps = { ...defaultProps, ...props };
  const {
    date,
    onDateChange,
    onClear,
    className,
    label,
    minDate: initialMinDate,
    maxDate: initialMaxDate,
    disabled,
    placeholder,
    closeOnComplete,
    minDaysBetween,
    dateFormat,
    defaultMonth: initialDefaultMonth,
    startYearOffset,
    endYearOffset,
    noLabel,
    buttonClassName,
    hideCloseButton = false,
    isOnModal = false,
    showAllOption = true
  } = mergedProps;

  const id = useId();
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<DateRange | undefined>(date);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const [isYearView, setIsYearView] = useState(false);
  const [month, setMonth] = useState<Date>(initialDefaultMonth || date?.from || new Date());

  const { minDate, maxDate, years, allRange, validMonths } = useMemo(() => {
    const today = new Date();
    const effectiveMinDate = initialMinDate || subYears(today, startYearOffset!);
    const effectiveMaxDate = initialMaxDate || addYears(today, endYearOffset!);

    const finalMinDate = isAfter(effectiveMinDate, effectiveMaxDate)
      ? effectiveMaxDate
      : effectiveMinDate;
    const finalMaxDate = isBefore(effectiveMaxDate, effectiveMinDate)
      ? effectiveMinDate
      : effectiveMaxDate;

    const calculatedYears = eachYearOfInterval({
      start: startOfYear(finalMinDate),
      end: endOfYear(finalMaxDate)
    });

    // Calculate "All" range
    let allRangeValue: DateRange;
    if (initialMinDate && initialMaxDate) {
      allRangeValue = { from: initialMinDate, to: initialMaxDate };
    } else {
      // Default to 1970-01-01 to today if no min/max dates provided
      allRangeValue = {
        from: new Date(1970, 0, 1),
        to: today
      };
    }

    // Calculate valid months for current year
    const currentYear = month.getFullYear();
    const validMonthsForYear: number[] = [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const testDate = new Date(currentYear, monthIndex, 1);
      const monthStart = getStartOfMonth(testDate);
      const monthEnd = getEndOfMonth(testDate);

      // Check if any part of this month falls within the valid range
      if (monthEnd >= finalMinDate && monthStart <= finalMaxDate) {
        validMonthsForYear.push(monthIndex);
      }
    }

    return {
      minDate: finalMinDate,
      maxDate: finalMaxDate,
      years: calculatedYears,
      allRange: allRangeValue,
      validMonths: validMonthsForYear
    };
  }, [initialMinDate, initialMaxDate, startYearOffset, endYearOffset, month]);

  const validYears = useMemo(() => {
    return years.map((year) => year.getFullYear());
  }, [years]);

  useEffect(() => {
    if (!isSameRange(date, tempDate)) {
      setTempDate(date);
      setError(null);
      setCount(0);
      if (
        date?.from &&
        (month.getMonth() !== date.from.getMonth() ||
          month.getFullYear() !== date.from.getFullYear())
      ) {
        setMonth(date.from);
      } else if (!date?.from) {
        setMonth(initialDefaultMonth || new Date());
      }
    }
    // we keep only date and initialDefaultMonth as dependency so user can select end date also
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, initialDefaultMonth]);

  const isSameRange = (a?: DateRange, b?: DateRange): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const aFromTime = a.from?.getTime();
    const aToTime = a.to?.getTime();
    const bFromTime = b.from?.getTime();
    const bToTime = b.to?.getTime();

    if (aFromTime && !aToTime && bFromTime && !bToTime) {
      return aFromTime === bFromTime;
    }
    return aFromTime === bFromTime && aToTime === bToTime;
  };

  const validateDateRange = (
    range: DateRange | undefined
  ): { valid: boolean; message?: string } => {
    if (!range || !range.from || !range.to) {
      return {
        valid: false,
        message: 'Please select both start and end dates.'
      };
    }
    if (!isValid(range.from) || !isValid(range.to)) {
      return { valid: false, message: 'Invalid date selected.' };
    }
    if (range.from > range.to) {
      return { valid: false, message: 'Start date must be before end date.' };
    }
    if (minDate) {
      const minDateLimit = subDays(minDate, 1);
      if (range.from < minDateLimit) {
        return {
          valid: false,
          message: `Start date cannot be before ${format(minDate, dateFormat!)}.`
        };
      }
    }
    if (maxDate && range.to > maxDate) {
      return {
        valid: false,
        message: `End date cannot be after ${format(maxDate, dateFormat!)}.`
      };
    }
    const dayDiff = differenceInDays(range.to, range.from);
    if (minDaysBetween && dayDiff < minDaysBetween) {
      return {
        valid: false,
        message: `Range must be at least ${minDaysBetween} day(s).`
      };
    }
    return { valid: true };
  };

  const handleSelectAllRange = () => {
    const validation = validateDateRange(allRange);
    if (validation.valid) {
      setTempDate(allRange);
      setError(null);
      onDateChange?.(allRange);
      setMonth(allRange.from && allRange.to ? allRange.from : new Date());
      if (closeOnComplete) {
        setOpen(false);
        setIsYearView(false);
      }
    } else {
      setError(validation.message || null);
    }
  };

  const handleSelect = (newDateRange: DateRange | undefined) => {
    setTempDate(newDateRange);

    if (!newDateRange) {
      setError(null);
      setCount(0);
      return;
    }

    if (newDateRange.from) {
      setError(null);
    }

    if (newDateRange.from && newDateRange.to) {
      let range = { from: newDateRange.from, to: newDateRange.to };
      if (isAfter(range.from, range.to)) {
        range = { from: range.to, to: range.from };
        setTempDate(range);
      }

      const validation = validateDateRange(range);
      setError(validation.message || null);

      if (validation.valid) {
        if (date?.from && date.to && validateDateRange(date).valid) {
          setCount((prev) => prev + 1);
        }

        if (!isSameRange(date, range) && (!date?.from || !date.to || count === 1)) {
          onDateChange?.(range);
          setCount(0);
          if (closeOnComplete) {
            setOpen(false);
            setIsYearView(false);
          }
        } else if (isSameRange(date, range)) {
          setCount(0);
          if (closeOnComplete) {
            setOpen(false);
            setIsYearView(false);
          }
        }
      }
    } else if (newDateRange.from && !newDateRange.to) {
      setError(null);
      if (date?.from && date?.to) {
        setCount(0);
      }
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTempDate(undefined);
    setError(null);
    setCount(0);
    onDateChange?.(undefined);
    onClear?.();
    setMonth(initialDefaultMonth || new Date());
    setOpen(false);
    setIsYearView(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      const validation = validateDateRange(tempDate);
      if (
        !tempDate ||
        !tempDate.from ||
        !validation.valid ||
        (tempDate.from && !tempDate.to && count === 0 && date?.from && date?.to)
      ) {
        if (!isSameRange(date, tempDate)) {
          setTempDate(date);
        }
        setError(null);
      } else if (tempDate?.from && tempDate.to && !isSameRange(date, tempDate) && count !== 0) {
        setTempDate(date);
        setError(null);
      }

      setCount(0);
      setIsYearView(false);
    } else {
      setMonth(tempDate?.from || date?.from || initialDefaultMonth || new Date());
      if (tempDate?.from && tempDate?.to) {
        setCount(0);
      }
    }
    setOpen(isOpen);
  };

  const formatDateDisplay = (d: Date | undefined): string =>
    d && isValid(d) ? format(d, dateFormat!) : '';

  const getDisplayText = (): string => {
    const displayDate = tempDate ?? date;
    if (!displayDate?.from) {
      if (date?.from && date?.to) {
        return `${formatDateDisplay(date.from)} - ${formatDateDisplay(date.to)}`;
      }
      return placeholder!;
    }
    if (displayDate.to)
      return `${formatDateDisplay(displayDate.from)} - ${formatDateDisplay(displayDate.to)}`;
    return `${formatDateDisplay(displayDate.from)}${
      tempDate?.from && !tempDate?.to ? ' - ...' : ''
    }`;
  };

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = setMonthFns(month, parseInt(monthIndex));
    setMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = setYearFns(month, parseInt(year));
    setMonth(newMonth);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className='space-y-2'>
        {!noLabel && label && (
          <div className='flex flex-col items-center'>
            <Label htmlFor={id}>{label}</Label>
          </div>
        )}

        <div className='flex items-center justify-between'>
          <Popover open={open && !disabled} onOpenChange={handleOpenChange} modal={isOnModal}>
            <PopoverTrigger asChild>
              <div className='relative w-full'>
                <Input
                  id={id}
                  type='text'
                  readOnly
                  value={getDisplayText()}
                  className={cn(
                    'h-9 w-full items-center justify-between pr-10 text-xs sm:text-sm',
                    !(tempDate?.from || date?.from) && 'text-muted-foreground',
                    disabled && 'cursor-not-allowed opacity-50',
                    buttonClassName
                  )}
                  disabled={disabled}
                  aria-expanded={open}
                  aria-haspopup='dialog'
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                <Icon
                  name='calendar'
                  aria-hidden='true'
                  className='absolute top-1/2 right-3 ml-2 h-4 w-4 -translate-y-1/2'
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              {/* Quick actions bar */}
              {showAllOption && (
                <div className='border-b p-2'>
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleSelectAllRange}
                      className='h-7 flex-1 text-xs'
                    >
                      <Icon name='maximize2' className='mr-1 h-3 w-3' />
                      All Range
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const today = new Date();
                        const startOfMonthDate = startOfMonth(today);
                        const endOfMonthDate = endOfMonth(today);
                        handleSelect({ from: startOfMonthDate, to: endOfMonthDate });
                      }}
                      className='h-7 flex-1 text-xs'
                    >
                      This Month
                    </Button>
                  </div>
                </div>
              )}

              <Calendar
                mode='range'
                selected={tempDate}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                defaultMonth={month}
                numberOfMonths={1}
                disabled={[
                  {
                    before: minDate,
                    after: maxDate
                  }
                ]}
                startMonth={minDate}
                endMonth={maxDate}
                components={{
                  CaptionLabel: (captionProps: CaptionLabelProps) => (
                    <CustomCaptionLabel
                      displayMonth={month}
                      isYearView={isYearView}
                      setIsYearView={setIsYearView}
                      validYears={validYears}
                      validMonths={validMonths}
                      onMonthChange={handleMonthChange}
                      onYearChange={handleYearChange}
                      {...captionProps}
                    />
                  ),
                  MonthGrid: (gridProps: MonthGridProps) => (
                    <CustomMonthGrid
                      className={gridProps.className}
                      isYearView={isYearView}
                      setIsYearView={setIsYearView}
                      startDate={minDate!}
                      endDate={maxDate!}
                      years={years}
                      currentYear={month.getFullYear()}
                      currentMonth={month.getMonth()}
                      onMonthSelect={(selectedMonth: Date) => {
                        setMonth(selectedMonth);
                        setIsYearView(false);
                      }}
                    >
                      {gridProps.children}
                    </CustomMonthGrid>
                  )
                }}
                className='overflow-hidden rounded-md border p-2'
                classNames={{
                  month_caption: 'ms-2.5 me-20 justify-start',
                  nav: 'justify-end',
                  nav_button_previous: 'absolute left-1 top-2.5',
                  nav_button_next: 'absolute right-1 top-2.5'
                }}
                aria-label='Select date range'
                autoFocus
              />
              {error && (
                <p className='text-destructive mt-1 mb-2 px-3 text-sm' id={`${id}-error`}>
                  {error}
                </p>
              )}
            </PopoverContent>
          </Popover>

          {!hideCloseButton && (tempDate?.from || date?.from) && !disabled && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleClear}
              disabled={disabled}
              aria-label='Clear date selection'
              className='h-7 px-2 text-xs'
            >
              <Icon name='x' className='mr-1 h-3 w-3' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface CustomCaptionLabelProps extends CaptionLabelProps {
  displayMonth: Date;
  isYearView: boolean;
  setIsYearView: Dispatch<SetStateAction<boolean>>;
  validYears: number[];
  validMonths: number[];
  onMonthChange: (monthIndex: string) => void;
  onYearChange: (year: string) => void;
}

function CustomCaptionLabel({
  displayMonth,
  isYearView,
  setIsYearView,
  validYears,
  validMonths,
  onMonthChange,
  onYearChange
}: CustomCaptionLabelProps) {
  const monthNames = [
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

  return (
    <div className='-ms-1 flex items-center gap-1'>
      {/* Month Dropdown */}
      <Select value={displayMonth.getMonth().toString()} onValueChange={onMonthChange}>
        <SelectTrigger className='hover:bg-muted/50 h-8 w-auto min-w-[100px] border-0 bg-transparent px-2 text-sm font-medium'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthNames.map((monthName, index) => (
            <SelectItem
              key={index}
              value={index.toString()}
              disabled={!validMonths.includes(index)}
              className='text-sm'
            >
              {monthName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year Dropdown */}
      <Select value={displayMonth.getFullYear().toString()} onValueChange={onYearChange}>
        <SelectTrigger className='hover:bg-muted/50 h-8 w-auto min-w-[70px] border-0 bg-transparent px-2 text-sm font-medium'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='max-h-[200px]'>
          {validYears.map((year) => (
            <SelectItem key={year} value={year.toString()} className='text-sm'>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface CustomMonthGridProps {
  className?: string;
  children: React.ReactNode;
  isYearView: boolean;
  setIsYearView: Dispatch<SetStateAction<boolean>>;
  startDate: Date;
  endDate: Date;
  years: Date[];
  currentYear: number;
  currentMonth: number;
  onMonthSelect: (date: Date) => void;
}

function CustomMonthGrid({
  className,
  children,
  isYearView,
  startDate,
  endDate,
  years,
  currentYear,
  currentMonth,
  onMonthSelect
}: CustomMonthGridProps) {
  const currentYearRef = useRef<HTMLDivElement>(null);
  const currentMonthButtonRef = useRef<HTMLButtonElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isYearView && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLElement>(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        const yearElement = currentYearRef.current;
        if (yearElement) {
          const yearTop = yearElement.offsetTop;
          viewport.scrollTop = Math.max(0, yearTop - 10);
        }
        setTimeout(() => {
          currentMonthButtonRef.current?.focus();
        }, 100);
      }
    }
  }, [isYearView]);

  const firstValidMonth = getStartOfMonth(startDate);
  const lastValidMonth = getEndOfMonth(endDate);

  return (
    <div className='relative'>
      <table className={cn(className, isYearView ? 'invisible' : '')}>{children}</table>

      {isYearView && (
        <div
          className={cn(
            className,
            isYearView ? 'bg-background absolute inset-0 z-20 -mx-2 -mb-2' : ''
          )}
        >
          <ScrollArea ref={scrollAreaRef} className='h-full w-full'>
            {years.map((yearDate) => {
              const year = yearDate.getFullYear();
              const months = eachMonthOfInterval({
                start: startOfYear(yearDate),
                end: endOfYear(yearDate)
              });
              const isCurrentYear = year === currentYear;

              return (
                <div key={year} ref={isCurrentYear ? currentYearRef : undefined}>
                  <CollapsibleYear title={year.toString()} open={isCurrentYear}>
                    <div className='grid grid-cols-3 gap-2 p-1'>
                      {months.map((monthDate) => {
                        const currentMonthStart = getStartOfMonth(monthDate);
                        const isDisabled =
                          isBefore(currentMonthStart, firstValidMonth) ||
                          isAfter(currentMonthStart, lastValidMonth);

                        const isCurrentSelectedMonth =
                          monthDate.getMonth() === currentMonth && year === currentYear;

                        return (
                          <Button
                            key={monthDate.getTime()}
                            ref={isCurrentSelectedMonth ? currentMonthButtonRef : undefined}
                            variant={isCurrentSelectedMonth ? 'default' : 'outline'}
                            size='sm'
                            className='h-7 w-full text-xs'
                            disabled={isDisabled}
                            onClick={() => onMonthSelect(monthDate)}
                            type='button'
                          >
                            {format(monthDate, 'MMM')}
                          </Button>
                        );
                      })}
                    </div>
                  </CollapsibleYear>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

interface CollapsibleYearProps {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}

function CollapsibleYear({ title, children, open }: CollapsibleYearProps) {
  return (
    <Collapsible className='border-t px-2 py-1.5' defaultOpen={open}>
      <CollapsibleTrigger asChild>
        <Button
          className='data-[state=open]:text-muted-foreground/80 flex w-full justify-start gap-2 text-sm font-medium hover:bg-transparent [&[data-state=open]>svg]:rotate-180'
          variant='ghost'
          size='sm'
          type='button'
        >
          <Icon
            name='chevronDown'
            className='text-muted-foreground/80 h-4 w-4 shrink-0 transition-transform duration-200'
            aria-hidden='true'
          />
          {title}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden'>
        <div className='px-3 py-1 text-sm'>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
