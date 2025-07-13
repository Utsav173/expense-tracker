'use client';

import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Category } from '@/lib/types';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface CategoryComboboxProps {
  value: string | undefined | null;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  clearLabel?: string;
}

const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  disabled,
  placeholder = 'Select or search category...',
  className,
  allowClear = false,
  clearLabel = 'All Categories'
}) => {
  const { data: initialCategoryData, isLoading: isLoadingInitial } = useQuery({
    queryKey: ['categoryById', value],
    queryFn: async () => {
      if (!value || value === 'all' || !/^[0-9a-fA-F-]{36}$/.test(value)) {
        return null;
      }

      const result = await categoryGetAll({ id: value, limit: 1 });
      return result?.categories?.[0] ?? null;
    },
    enabled: !!value && value !== 'all',
    staleTime: Infinity,
    gcTime: Infinity
  });

  const fetchCategoryOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      try {
        const data = await categoryGetAll({
          search: query,
          limit: 20,
          sortBy: 'name',
          sortOrder: 'asc'
        });

        let fetchedOptions: ComboboxOption[] =
          data?.categories?.map((cat: Category) => ({
            value: cat.id,
            label: cat.name
          })) ?? [];

        if (allowClear && !query) {
          fetchedOptions.unshift({ value: 'all', label: clearLabel });
        }

        return fetchedOptions;
      } catch (err) {
        console.error('Failed to search categories:', err);

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

    if (initialCategoryData && initialCategoryData.id === value) {
      return { value: initialCategoryData.id, label: initialCategoryData.name };
    }

    return null;
  }, [value, initialCategoryData, isLoadingInitial, allowClear, clearLabel]);

  if (isLoadingInitial && value && value !== 'all') {
    return <Skeleton className={cn('h-10 w-full', className)} />;
  }

  return (
    <Combobox
      value={comboboxValue}
      onChange={handleComboboxChange}
      fetchOptions={fetchCategoryOptions}
      placeholder={placeholder}
      noOptionsMessage='No matching categories found.'
      loadingPlaceholder='Searching categories...'
      className={className}
      disabled={disabled || isLoadingInitial}
    />
  );
};

export default CategoryCombobox;
