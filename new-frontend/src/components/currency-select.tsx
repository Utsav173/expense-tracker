'use client';

import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Define a proper type for currency.
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
  const [open, setOpen] = useState(false);

  const selectedCurrency = currencies.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20'
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {isLoading
              ? 'Loading currencies...'
              : value && selectedCurrency
                ? `${selectedCurrency.code} - ${selectedCurrency.name}`
                : 'Select currency'}
          </span>
          <ChevronDown size={16} className='shrink-0 text-muted-foreground/80' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='z-[100] w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0'>
        <Command>
          <CommandInput placeholder='Search currencies...' />
          <ScrollArea className='max-h-[200px]'>
            <CommandList>
              <CommandEmpty>No currency found.</CommandEmpty>
              <CommandGroup>
                {currencies.map((currency) => (
                  <CommandItem
                    key={currency.code}
                    value={`${currency.code} ${currency.name}`.toLowerCase()}
                    onSelect={() => {
                      onValueChange(currency.code);
                      setOpen(false);
                    }}
                    className='cursor-pointer'
                  >
                    {`${currency.code} - ${currency.name}`}
                    {value === currency.code && <Check size={16} className='ml-auto' />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CurrencySelect;
