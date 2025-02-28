'use client';

import React from 'react';
import BudgetList from '@/components/budget/budget-list';
import AddBudgetModal from '@/components/modals/add-budget-modal';
import { useQueryClient } from '@tanstack/react-query';

const BudgetPage = () => {
  const queryClient = useQueryClient();

  const handleBudgetAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold'>Budgets</h1>
        <AddBudgetModal onBudgetAdded={handleBudgetAdded} />
      </div>
      <BudgetList />
    </div>
  );
};

export default BudgetPage;
