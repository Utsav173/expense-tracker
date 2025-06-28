'use client';
import { Investment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import ComingSoonModal from '../modals/comming-soon-modal';

interface InvestmentHoldingActionsProps {
  investment: Investment;
  handleEdit: (investment: Investment) => void;
  handleDeleteClick: (id: string) => void;
}

export function InvestmentHoldingActions({
  investment,
  handleEdit,
  handleDeleteClick
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
        <Eye size={16} />
      </Button>
      <Button
        size='icon'
        variant='ghost'
        className='h-8 w-8 hover:text-blue-600'
        onClick={() => handleEdit(investment)}
        aria-label='Edit Investment'
      >
        <Pencil size={16} />
      </Button>
      <Button
        size='icon'
        variant='ghost'
        className='text-destructive hover:text-destructive h-8 w-8'
        onClick={() => handleDeleteClick(investment.id)}
        aria-label='Delete Investment'
      >
        <Trash2 size={16} />
      </Button>
      <ComingSoonModal
        isOpen={isInsightModalOpen}
        onOpenChange={setIsInsightModalOpen}
        featureName='Investment Insight & Details'
      />
    </div>
  );
}
