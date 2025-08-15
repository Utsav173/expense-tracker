'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { fetchCurrencies } from '@/lib/endpoints/currency';
import { Skeleton } from './skeleton';
import { Icon } from './icon';
import { Input } from './input';

export interface Currency {
  code: string;
  name: string;
}

interface CurrencyComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const CurrencyCombobox: React.FC<CurrencyComboboxProps> = ({
  value,
  onValueChange,
  disabled,
  placeholder = 'Select currency...',
  className
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: currencies, isLoading } = useQuery<Currency[]>({
    queryKey: ['currencies'],
    queryFn: fetchCurrencies,
    staleTime: 24 * 60 * 60 * 1000 // 24 hours
  });

  const filteredCurrencies = useMemo(() => {
    if (!currencies) return [];
    if (!search) return currencies;
    const lowercasedSearch = search.toLowerCase();
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(lowercasedSearch) ||
        c.name.toLowerCase().includes(lowercasedSearch)
    );
  }, [currencies, search]);

  const selectedCurrencyLabel = useMemo(() => {
    return currencies?.find((c) => c.code.toLowerCase() === value?.toLowerCase())?.name;
  }, [currencies, value]);

  if (isLoading) {
    return <Skeleton className='h-10 w-full' />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className, disabled && 'cursor-not-allowed')}>
          <Input
            readOnly
            value={value ? `${value} - ${selectedCurrencyLabel || ''}` : placeholder}
            className='w-full cursor-pointer justify-between'
            disabled={disabled}
            role='combobox'
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          />
          <Icon
            name='chevronsUpDown'
            className='absolute top-1/2 right-2 h-4 w-4 shrink-0 -translate-y-1/2 opacity-50'
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
        <Command>
          <CommandInput placeholder='Search currency...' value={search} onValueChange={setSearch} />
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {filteredCurrencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code} - ${currency.name}`}
                  onSelect={() => {
                    onValueChange?.(currency.code);
                    setOpen(false);
                  }}
                >
                  <Icon
                    name='check'
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === currency.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {currency.code} - {currency.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
