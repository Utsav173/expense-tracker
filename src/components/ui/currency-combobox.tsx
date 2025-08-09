'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import { fetchCurrencies } from '@/lib/endpoints/currency';
import { Skeleton } from './skeleton';
import type { Currency } from './currency-select';

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
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
          disabled={disabled}
        >
          <span className='truncate'>
            {value ? `${value} - ${selectedCurrencyLabel || ''}` : placeholder}
          </span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
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
                  <Check
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
