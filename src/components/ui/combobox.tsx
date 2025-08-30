'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
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
import { Icon } from './icon';
import { Input } from './input';

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

export interface ComboboxHandle {
  preloadOptions: (query?: string) => Promise<void>;
}

export const Combobox = React.forwardRef<ComboboxHandle | null, ComboboxProps>(
  (
    {
      value,
      onChange,
      fetchOptions,
      placeholder = 'Select option...',
      noOptionsMessage = 'No option found.',
      loadingPlaceholder = 'Loading...',
      className,
      disabled,
      id
    },
    ref // optional
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
    const [isLoading, setIsLoading] = React.useState(false);
    const [options, setOptions] = React.useState<ComboboxOption[]>([]);
    const triggerRef = React.useRef<HTMLInputElement>(null);

    const loadOptions = React.useCallback(
      async (query: string) => {
        setIsLoading(true);
        try {
          const fetchedOptions = await fetchOptions(query);
          setOptions(fetchedOptions);
        } catch (error) {
          console.error('Failed to fetch combobox options:', error);
          setOptions([]);
        } finally {
          setIsLoading(false);
        }
      },
      [fetchOptions]
    );

    // 👇 expose only if ref is provided
    React.useImperativeHandle(ref, () => ({
      preloadOptions: (query: string = '') => loadOptions(query)
    }));

    React.useEffect(() => {
      if (!open) {
        setSearchQuery('');
        return;
      }
      loadOptions(debouncedSearchQuery);
    }, [open, debouncedSearchQuery, loadOptions]);

    const handleSelect = (currentValue: string) => {
      const selectedOption = options.find(
        (option) => option.value.toLowerCase() === currentValue.toLowerCase()
      );
      onChange(selectedOption || null);
      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className={cn('relative', className, disabled && 'cursor-not-allowed')}>
            <Input
              readOnly
              value={value ? value.label : placeholder}
              className='w-full cursor-pointer justify-between'
              disabled={disabled}
              role='combobox'
              aria-expanded={open}
              ref={triggerRef}
              onClick={() => setOpen(!open)}
            />
            <Icon
              name='chevronsUpDown'
              className='absolute top-1/2 right-2 h-4 w-4 shrink-0 -translate-y-1/2 opacity-50'
            />
          </div>
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
          <Command>
            <CommandInput placeholder={placeholder} onValueChange={setSearchQuery} />
            <CommandList>
              {isLoading ? (
                <div className='text-muted-foreground flex items-center justify-center p-2 text-sm'>
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
                  {loadingPlaceholder}
                </div>
              ) : (
                <>
                  <CommandEmpty>{noOptionsMessage}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem key={option.value} value={option.value} onSelect={handleSelect}>
                        <Icon
                          name='check'
                          className={cn(
                            'mr-2 h-4 w-4',
                            value?.value === option.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

Combobox.displayName = 'Combobox';
