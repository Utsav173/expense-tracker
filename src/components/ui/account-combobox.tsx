'use client';

import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountGetAll, accountGetById } from '@/lib/endpoints/accounts';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { AccountAPI } from '@/lib/api/api-types';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface AccountComboboxProps {
  value: string | undefined | null;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  clearLabel?: string;
  setDateRange?: Dispatch<SetStateAction<DateRange | undefined>>;
  id: HTMLDivElement['id'];
}

const AccountCombobox: React.FC<AccountComboboxProps> = ({
  value,
  onChange,
  disabled,
  placeholder = 'Select or search account...',
  className,
  allowClear = false,
  clearLabel = 'All Accounts',
  setDateRange,
  id
}) => {
  const { data: initialAccountData, isLoading: isLoadingInitial } = useQuery({
    queryKey: ['accountById', value],
    queryFn: async () => {
      if (!value || value === 'all' || !/^[0-9a-fA-F-]{36}$/.test(value)) {
        return null;
      }

      const result = await accountGetById(value);

      if (setDateRange && result?.oldestTransactionDate && result?.recentDateAsToday) {
        setDateRange?.({
          from: new Date(result.oldestTransactionDate),
          to: new Date(result.recentDateAsToday)
        });
      }

      return result ?? null;
    },
    enabled: !!value && value !== 'all',
    staleTime: Infinity,
    gcTime: Infinity
  });

  const fetchAccountOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      try {
        const data = await accountGetAll({
          search: query,
          limit: 20,
          sortBy: 'name',
          sortOrder: 'asc',
          page: 1
        });

        let fetchedOptions: ComboboxOption[] =
          data?.accounts?.map((acc: AccountAPI.Account) => ({
            value: acc.id,
            label: `${acc.name} (${acc.currency || 'N/A'})`
          })) ?? [];

        if (allowClear && !query) {
          fetchedOptions.unshift({ value: 'all', label: clearLabel });
        }

        return fetchedOptions;
      } catch (err) {
        console.error('Failed to search accounts:', err);

        return [];
      }
    },
    [allowClear, clearLabel]
  );

  const handleComboboxChange = useCallback(
    (selected: ComboboxOption | null) => {
      const newValue = selected?.value;

      if (allowClear && newValue === 'all') {
        onChange(undefined);
      } else {
        onChange(newValue);
      }
    },
    [onChange, allowClear]
  );

  const comboboxValue = useMemo(() => {
    if (isLoadingInitial && value && value !== 'all') {
      return null;
    }

    if (allowClear && (value === 'all' || value === undefined || value === null)) {
      return { value: 'all', label: clearLabel };
    }

    if (initialAccountData && initialAccountData.id === value) {
      return {
        value: initialAccountData.id,
        label: `${initialAccountData.name} (${initialAccountData.currency || 'N/A'})`
      };
    }

    return null;
  }, [value, initialAccountData, isLoadingInitial, allowClear, clearLabel]);

  if (isLoadingInitial && value && value !== 'all') {
    return <Skeleton className={cn('h-10 w-full', className)} />;
  }

  return (
    <Combobox
      value={comboboxValue}
      onChange={handleComboboxChange}
      fetchOptions={fetchAccountOptions}
      placeholder={placeholder}
      noOptionsMessage='No matching accounts found.'
      loadingPlaceholder='Searching accounts...'
      className={className}
      disabled={disabled || isLoadingInitial}
      id={id}
    />
  );
};

export default AccountCombobox;
