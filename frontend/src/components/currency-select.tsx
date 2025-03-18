'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface Currency {
  code: string;
  name: string;
}

interface CurrencySelectProps {
  currencies?: Currency[];
  value?: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({
  currencies = [],
  value,
  onValueChange,
  isLoading = false
}) => {
  const selectedCurrency = currencies.find((c) => c.code === value);

  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger className='w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20'>
        <SelectValue placeholder='Select currency'>
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {isLoading
              ? 'Loading currencies...'
              : value && selectedCurrency
                ? `${selectedCurrency.code} - ${selectedCurrency.name}`
                : 'Select currency'}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='w-full border-input p-0'>
        <SelectGroup>
          {currencies.map((currency) => (
            <SelectItem
              key={currency.code}
              value={currency.code}
              className={cn('flex cursor-pointer items-center justify-between', {
                'bg-accent text-accent-foreground': currency.code === value
              })}
            >
              {`${currency.code} - ${currency.name}`}
            </SelectItem>
          ))}
        </SelectGroup>
        {currencies.length === 0 && !isLoading && (
          <div className='p-2 text-center text-sm text-muted-foreground'>No currency found.</div>
        )}
        {isLoading && (
          <div className='p-2 text-center text-sm text-muted-foreground'>Loading currencies...</div>
        )}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelect;
