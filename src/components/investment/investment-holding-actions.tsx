'use client';
import type { InvestmentAPI } from '@/lib/api/api-types';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import InvestmentInsightModal from '../modals/investment-insight-modal';
import { Icon } from '../ui/icon';

interface InvestmentHoldingActionsProps {
  investment: InvestmentAPI.Investment;
  handleEdit: (investment: InvestmentAPI.Investment) => void;
  handleDeleteClick: (id: string) => void;
  accountCurrency: string;
}

export function InvestmentHoldingActions({
  investment,
  handleEdit,
  handleDeleteClick,
  accountCurrency
}: InvestmentHoldingActionsProps) {
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);

  return (
    <div className='flex justify-end gap-1'>
      <Button
        size='icon'
        variant='ghost'
        className='hover:text-primary h-8 w-8'
        onClick={() => setIsInsightModalOpen(true)}
        aria-label='View Investment Insight'
      >
        <Icon name='eye' className='h-4 w-4' />
      </Button>
      <Button
        size='icon'
        variant='ghost'
        className='h-8 w-8 hover:text-blue-600'
        onClick={() => handleEdit(investment)}
        aria-label='Edit Investment'
      >
        <Icon name='pencil' className='h-4 w-4' />
      </Button>
      <Button
        size='icon'
        variant='ghost'
        className='text-destructive hover:text-destructive h-8 w-8'
        onClick={() => handleDeleteClick(investment.id)}
        aria-label='Delete Investment'
      >
        <Icon name='trash2' className='h-4 w-4' />
      </Button>

      {isInsightModalOpen && (
        <InvestmentInsightModal
          isOpen={isInsightModalOpen}
          onOpenChange={setIsInsightModalOpen}
          investment={investment}
          accountCurrency={accountCurrency}
        />
      )}
    </div>
  );
}
