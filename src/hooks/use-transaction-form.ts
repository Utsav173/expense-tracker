'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll, categoryCreate } from '@/lib/endpoints/category';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { useToast } from '@/lib/hooks/useToast';
import { Transaction as TransactionType, Category } from '@/lib/types';
import { ComboboxOption } from '@/components/ui/combobox';
import { parseISO } from 'date-fns';

const updateTransactionSchema = z.object({
  text: z.string().min(3, 'Description must be at least 3 characters.').max(255),
  amount: z
    .string()
    .min(1, { message: 'Amount is required.' })
    .refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0, {
      message: 'Amount must be a non-negative number.'
    }),
  isIncome: z.boolean(),
  categoryId: z.string().uuid('Invalid category format.').optional().nullable(),
  createdAt: z.date({ required_error: 'Transaction date is required.' }),
  transfer: z.string().max(64, 'Transfer info too long.').optional().nullable()
});

export const useTransactionForm = ({
  transaction,
  isOpen
}: {
  transaction: TransactionType | null;
  isOpen: boolean;
}) => {
  const { showError } = useToast();
  const [categoryComboboxLoading, setCategoryComboboxLoading] = useState(false);
  const [categoryComboboxError, setCategoryComboboxError] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  const isRecurringInstance = useMemo(() => !!transaction?.recurring, [transaction]);

  const form = useForm<z.infer<typeof updateTransactionSchema>>({
    resolver: zodResolver(updateTransactionSchema),
    mode: 'onChange'
  });

  const {
    data: categoriesData,
    isLoading: isLoadingCategory,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryGetAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000
  });

  const { data: accountsData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['accountDropdown'],
    queryFn: accountGetDropdown,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (isOpen && transaction) {
      form.reset({
        text: transaction.text || '',
        amount: transaction.amount?.toString() ?? '',
        isIncome: transaction.isIncome ?? false,
        categoryId: transaction.category?.id || null,
        createdAt: transaction.createdAt ? parseISO(transaction.createdAt) : new Date(),
        transfer: transaction.transfer || null
      });
    } else if (!isOpen) {
      form.reset({
        text: '',
        amount: '',
        isIncome: false,
        categoryId: null,
        createdAt: new Date(),
        transfer: null
      });
    }
  }, [isOpen, transaction, form]);

  useEffect(() => {
    if (categoriesData?.categories) {
      setLocalCategories(categoriesData.categories);
    }
  }, [categoriesData]);

  const fetchCategoryOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      setCategoryComboboxError(null);
      setCategoryComboboxLoading(true);
      try {
        const currentCategories = localCategories || [];
        const filtered = currentCategories
          .filter((cat) => cat.name.toLowerCase().includes(query.toLowerCase()))
          .map((cat) => ({ value: cat.id, label: cat.name }));

        const options = filtered;

        if (query && !options.some((opt) => opt.label.toLowerCase() === query.toLowerCase())) {
          options.push({ value: '__create__', label: `Create "${query}"` });
        }
        return options;
      } catch (err: any) {
        setCategoryComboboxError('Failed to load categories');
        return [];
      } finally {
        setCategoryComboboxLoading(false);
      }
    },
    [localCategories]
  );

  const handleCreateCategoryInline = useCallback(
    async (name: string): Promise<ComboboxOption | null> => {
      try {
        const res = await categoryCreate({ name });
        if (res && res.data.id) {
          await refetchCategories();
          return { value: res.data.id, label: res.data.name };
        }
        throw new Error('Invalid response');
      } catch (err: any) {
        showError(err.message || 'Failed to create category');
        return null;
      }
    },
    [refetchCategories, showError]
  );

  const handleCategoryComboboxChange = useCallback(
    async (option: ComboboxOption | null) => {
      if (!option) {
        form.setValue('categoryId', null);
        return;
      }
      if (option.value === '__create__') {
        const match = option.label.match(/^Create\s+"(.+)"$/);
        const name = match ? match[1] : '';
        if (name) {
          const created = await handleCreateCategoryInline(name);
          if (created) {
            form.setValue('categoryId', created.value);
          }
        }
        return;
      }
      form.setValue('categoryId', option.value);
    },
    [form, handleCreateCategoryInline]
  );

  return {
    form,
    isRecurringInstance,
    accountsData,
    isLoadingAccount,
    localCategories,
    isLoadingCategory,
    fetchCategoryOptions,
    handleCategoryComboboxChange,
    categoryComboboxLoading,
    categoryComboboxError
  };
};
