'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from 'use-debounce';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: ComboboxOption | null | undefined;
  onChange: (value: ComboboxOption | null) => void;
  fetchOptions: (query: string) => Promise<ComboboxOption[]>;
  placeholder?: string;
  noOptionsMessage?: string;
  loadingPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  id?: HTMLDivElement['id'];
}

export function Combobox({
  value,
  onChange,
  fetchOptions,
  placeholder = 'Select option...',
  noOptionsMessage = 'No option found.',
  loadingPlaceholder = 'Loading...',
  className,
  disabled,
  id
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [isLoading, setIsLoading] = React.useState(false);
  const [options, setOptions] = React.useState<ComboboxOption[]>([]);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }

    const loadOptions = async () => {
      setIsLoading(true);
      try {
        const fetchedOptions = await fetchOptions(debouncedSearchQuery);
        setOptions(fetchedOptions);
      } catch (error) {
        console.error('Failed to fetch combobox options:', error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, [open, debouncedSearchQuery, fetchOptions]);

  React.useEffect(() => {
    if (value && value.label !== searchQuery && !open) {
      setSearchQuery(value.label);
    } else if (!value && !open) {
      setSearchQuery('');
    }
  }, [value, open, searchQuery]);

  const handleSelect = (currentValue: string) => {
    const selectedOption = options.find(
      (option) => option.value.toLowerCase() === currentValue.toLowerCase()
    );
    onChange(selectedOption || null);
    setSearchQuery(selectedOption?.label || ''); // Update input display
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'border-border w-full justify-between bg-transparent font-normal',
            className
          )}
          id={id}
        >
          <span className='truncate'>{value?.label || placeholder}</span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-full p-0'
        style={{
          width: triggerRef.current
            ? `${triggerRef.current.offsetWidth}px`
            : 'var(--radix-popover-trigger-width)'
        }}
        align='start'
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            disabled={disabled}
          />
          <CommandList>
            {isLoading ? (
              <div className='text-muted-foreground flex items-center justify-center p-2 text-sm'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {loadingPlaceholder}
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>{noOptionsMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    disabled={disabled}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value?.value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
