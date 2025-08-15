'use client';

import React, { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryGetAll, categoryGetById, categoryCreate } from '@/lib/endpoints/category';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { CategoryAPI } from '@/lib/api/api-types';
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
  creatable?: boolean;
}

const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  disabled,
  placeholder = 'Select or search category...',
  className,
  allowClear = false,
  clearLabel = 'All Categories',
  creatable = false
}) => {
  const queryClient = useQueryClient();

  const { data: initialCategoryData, isLoading: isLoadingInitial } = useQuery({
    queryKey: ['categoryById', value],
    queryFn: async () => {
      if (!value || value === 'all' || !/^[0-9a-fA-F-]{36}$/.test(value)) {
        return null;
      }

      const result = await categoryGetById(value);
      return result?.data ?? null;
    },
    enabled: !!value && value !== 'all',
    staleTime: Infinity,
    gcTime: Infinity
  });

  const { mutate: createCategory, isPending: isCreating } = useMutation({
    mutationFn: async (categoryName: string) => {
      const result = await categoryCreate({ name: categoryName });
      if (!result?.data) {
        throw new Error('Failed to create category.');
      }
      return result.data;
    },
    onSuccess: (newCategory) => {
      onChange(newCategory.id);
      queryClient.invalidateQueries({ queryKey: ['categoryGetAll'] });
      queryClient.setQueryData(['categoryById', newCategory.id], newCategory);
    },
    onError: (err) => {
      console.error('Failed to create category:', err);
    }
  });

  const fetchCategoryOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      try {
        const data = await categoryGetAll({
          search: query,
          limit: 20,
          sortBy: 'name',
          sortOrder: 'asc',
          page: 1
        });

        let fetchedOptions: ComboboxOption[] =
          data?.categories?.map((cat: CategoryAPI.Category) => ({
            value: cat.id,
            label: cat.name
          })) ?? [];

        if (
          creatable &&
          query &&
          !fetchedOptions.some((opt) => opt.label.toLowerCase() === query.toLowerCase())
        ) {
          fetchedOptions.unshift({
            value: `_create_${query}`,
            label: `Create "${query}"`
          });
        }

        if (allowClear && !query) {
          fetchedOptions.unshift({ value: 'all', label: clearLabel });
        }

        return fetchedOptions;
      } catch (err) {
        console.error('Failed to search categories:', err);
        return [];
      }
    },
    [allowClear, clearLabel, creatable]
  );

  const handleComboboxChange = useCallback(
    (selected: ComboboxOption | null) => {
      const newValue = selected?.value;

      // 5. Handle the "Create" action
      if (creatable && newValue?.startsWith('_create_')) {
        const categoryNameToCreate = newValue.substring(8); // Remove '_create_' prefix
        createCategory(categoryNameToCreate);
        return;
      }

      if (allowClear && newValue === 'all') {
        onChange(undefined);
      } else {
        onChange(newValue);
      }
    },
    [onChange, allowClear, creatable, createCategory]
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
      disabled={disabled || isLoadingInitial || isCreating}
    />
  );
};

export default CategoryCombobox;
