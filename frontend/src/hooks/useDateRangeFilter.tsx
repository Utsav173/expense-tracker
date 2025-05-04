import { useState, useEffect, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { useSearchParams, useRouter } from 'next/navigation';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';

interface UseDateRangeFilterProps {
  defaultRange?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  label?: string;
  className?: string;
  urlPersistence?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

interface UseDateRangeFilterReturn {
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
  DateRangeFilter: React.FC;
}

export const useDateRangeFilter = ({
  defaultRange,
  onDateChange,
  label = '',
  className,
  urlPersistence = true,
  maxDate,
  minDate
}: UseDateRangeFilterProps = {}): UseDateRangeFilterReturn => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);

  useEffect(() => {
    if (urlPersistence) {
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      if (from && to) {
        setDateRange({
          from: new Date(from),
          to: new Date(to)
        });
      }
    }
  }, [searchParams]);

  const handleDateChange = useCallback(
    (newDate: DateRange | undefined) => {
      setDateRange(newDate);

      if (onDateChange) {
        onDateChange(newDate);
      }

      if (newDate?.from && newDate?.to && urlPersistence) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('from', newDate.from.toISOString());
        params.set('to', newDate.to.toISOString());
        router.push(`?${params.toString()}`);
      }
    },
    [onDateChange, router, searchParams]
  );

  const handleClear = useCallback(() => {
    setDateRange(undefined);
    if (onDateChange) {
      onDateChange(undefined);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('from');
    params.delete('to');
    router.push(`?${params.toString()}`);
  }, [onDateChange, router, searchParams]);

  const DateRangeFilter: React.FC = useCallback(
    () => (
      <DateRangePickerV2
        date={dateRange}
        onDateChange={handleDateChange}
        onClear={handleClear}
        label={label}
        className={className}
        minDate={minDate}
        maxDate={maxDate}
      />
    ),
    [dateRange, handleDateChange, handleClear, label, className]
  );

  return {
    dateRange,
    setDateRange,
    DateRangeFilter
  };
};
