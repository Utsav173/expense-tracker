'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import InterestCalculator from '../debt/interest-calculator';
import { z } from 'zod';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';

type InterestFormSchema = z.infer<typeof apiEndpoints.interest.calculate.body>;

interface InterestCalculatorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton?: React.ReactNode;
  onUseCalculation: (data: InterestFormSchema) => void;
}

const InterestCalculatorModal: React.FC<InterestCalculatorModalProps> = ({
  isOpen,
  onOpenChange,
  triggerButton,
  onUseCalculation
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Interest Calculator</DialogTitle>
          <DialogDescription>
            Quickly calculate simple or compound interest for a loan.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <InterestCalculator onUseCalculation={onUseCalculation} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterestCalculatorModal;
