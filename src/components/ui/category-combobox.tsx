'use client';

import React, { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryGetAll, categoryGetById, categoryCreate } from '@/lib/endpoints/category';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/hooks/useToast';

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
  const { showError } = useToast();

  const { data: initialCategoryData, isLoading: isLoadingInitial } = useQuery({
    queryKey: ['categoryById', value],
    queryFn: async () => {
      if (!value || value === 'all' || !/^[0-9a-fA-F-]{36}$/.test(value)) {
        return null;
      }
      const result = await categoryGetById(value);
      return result?.data ?? null; // The query function should return the category object itself
    },
    enabled: !!value && value !== 'all',
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { mutate: createCategory, isPending: isCreating } = useMutation({
    mutationFn: (categoryName: string) => categoryCreate({ name: categoryName }),
    onSuccess: (newCategoryResponse) => {
      const newCategory = newCategoryResponse.data;
      if (!newCategory) return;

      // **FIX #1: Pre-populate the cache after creating a new category**
      // This ensures the useQuery for this new ID resolves instantly.
      queryClient.setQueryData(['categoryById', newCategory.id], newCategory);

      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      queryClient.invalidateQueries({ queryKey: ['allCategoriesForCombobox'] });

      onChange(newCategory.id);
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to create category.');
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

        const fetchedOptions: ComboboxOption[] =
          data?.categories?.map((cat) => ({
            value: cat.id,
            label: cat.name
          })) ?? [];

        if (value && initialCategoryData && !fetchedOptions.some((opt) => opt.value === value)) {
          fetchedOptions.unshift({
            value: initialCategoryData.id,
            label: initialCategoryData.name
          });
        }

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
    [allowClear, clearLabel, creatable, value, initialCategoryData]
  );

  const handleComboboxChange = useCallback(
    (selected: ComboboxOption | null) => {
      const newValue = selected?.value;

      if (!newValue) {
        onChange(undefined);
        return;
      }

      if (creatable && newValue.startsWith('_create_')) {
        const categoryNameToCreate = newValue.substring(8);
        createCategory(categoryNameToCreate);
        return;
      }

      if (allowClear && newValue === 'all') {
        onChange(undefined);
        return;
      }

      if (selected) {
        queryClient.setQueryData(['categoryById', selected.value], {
          id: selected.value,
          name: selected.label
        });
      }

      onChange(newValue);
    },
    [onChange, allowClear, creatable, createCategory, queryClient]
  );

  const comboboxValue = useMemo(() => {
    if (allowClear && (value === 'all' || !value)) {
      return { value: 'all', label: clearLabel };
    }
    if (initialCategoryData) {
      return { value: initialCategoryData.id, label: initialCategoryData.name };
    }
    return null;
  }, [value, initialCategoryData, allowClear, clearLabel]);

  if (isLoadingInitial && !initialCategoryData) {
    return <Skeleton className={cn('h-10 w-full', className)} />;
  }

  return (
    <Combobox
      value={comboboxValue}
      onChange={handleComboboxChange}
      fetchOptions={fetchCategoryOptions}
      placeholder={placeholder}
      noOptionsMessage='No categories found. Type to create.'
      loadingPlaceholder='Searching categories...'
      className={className}
      disabled={disabled || isCreating}
    />
  );
};

export default CategoryCombobox;
