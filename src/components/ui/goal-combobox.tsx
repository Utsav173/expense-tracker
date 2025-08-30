'use client';

import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { goalGetDropdown } from '@/lib/endpoints/goal';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface GoalDropdownItem {
  id: string;
  name: string;
}

interface GoalComboboxProps {
  value: string | undefined | null;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const GoalCombobox: React.FC<GoalComboboxProps> = ({
  value,
  onChange,
  disabled,
  placeholder = 'Select or search goal...',
  className
}) => {
  const { data: initialGoalData, isLoading: isLoadingInitial } = useQuery({
    queryKey: ['goalById', value],
    queryFn: async (): Promise<GoalDropdownItem | null> => {
      if (!value) return null;

      const allGoals = await goalGetDropdown('');
      const selectedGoal = allGoals.find((goal) => goal.id === value);

      return selectedGoal || null;
    },
    enabled: !!value,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const fetchGoalOptions = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    try {
      const data = await goalGetDropdown(query);
      return data.map((goal) => ({
        value: goal.id,
        label: goal.name
      }));
    } catch (err) {
      console.error('Failed to search goals:', err);
      return [];
    }
  }, []);

  const handleComboboxChange = useCallback(
    (selected: ComboboxOption | null) => {
      onChange(selected?.value);
    },
    [onChange]
  );

  const comboboxValue = useMemo(() => {
    if (initialGoalData) {
      return { value: initialGoalData.id, label: initialGoalData.name };
    }
    return null;
  }, [initialGoalData]);

  if (isLoadingInitial && value) {
    return <Skeleton className={cn('h-10 w-full', className)} />;
  }

  return (
    <Combobox
      value={comboboxValue}
      onChange={handleComboboxChange}
      fetchOptions={fetchGoalOptions}
      placeholder={placeholder}
      noOptionsMessage='No goals found.'
      loadingPlaceholder='Searching goals...'
      className={className}
      disabled={disabled}
    />
  );
};

export default GoalCombobox;
