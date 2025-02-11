import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      const newDate = new Date(selectedDate);
      newDate.setFullYear(date.getFullYear());
      newDate.setMonth(date.getMonth());
      newDate.setDate(date.getDate());
      setSelectedDate(newDate);
      onChange?.(newDate);
    }
  };

  const handleTimeChange = (type: TimeType, value: string | number): void => {
    const newDate = new Date(selectedDate);

    if (type === 'hour') {
      const hour = parseInt(value.toString());
      const isPM = selectedDate.getHours() >= 12;
      newDate.setHours(isPM ? hour + 12 : hour);
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(value.toString()));
    } else if (type === 'ampm') {
      const currentHour = newDate.getHours();
      const hour = currentHour % 12;
      if (value === 'AM' && currentHour >= 12) {
        newDate.setHours(hour);
      } else if (value === 'PM' && currentHour < 12) {
        newDate.setHours(hour + 12);
      }
    }

    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          {selectedDate ? (
            format(selectedDate, 'MM/dd/yyyy hh:mm aa')
          ) : (
            <span>MM/DD/YYYY hh:mm aa</span>
          )}
          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <div className='flex'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className='flex flex-col divide-y border-l'>
            <ScrollArea className='h-80'>
              <div className='grid grid-cols-1 gap-1 p-2'>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                  <Button
                    key={hour}
                    variant={selectedDate?.getHours() % 12 === hour % 12 ? 'default' : 'ghost'}
                    className='w-12'
                    onClick={() => handleTimeChange('hour', hour)}
                  >
                    {hour.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className='h-80'>
              <div className='grid grid-cols-1 gap-1 p-2'>
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    variant={selectedDate?.getMinutes() === minute ? 'default' : 'ghost'}
                    className='w-12'
                    onClick={() => handleTimeChange('minute', minute)}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <div className='grid grid-cols-1 gap-1 p-2'>
              {(['AM', 'PM'] as const).map((ampm) => (
                <Button
                  key={ampm}
                  variant={
                    selectedDate &&
                    ((ampm === 'AM' && selectedDate.getHours() < 12) ||
                      (ampm === 'PM' && selectedDate.getHours() >= 12))
                      ? 'default'
                      : 'ghost'
                  }
                  className='w-12'
                  onClick={() => handleTimeChange('ampm', ampm)}
                >
                  {ampm}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateTimePicker;
