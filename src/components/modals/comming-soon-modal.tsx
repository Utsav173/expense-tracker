'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import ComingSoon from '@/components/ui/coming-soon';
import { Button } from '../ui/button';

interface ComingSoonModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  children?: React.ReactNode;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onOpenChange,
  featureName = 'Feature',
  children
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='mb-4'>
          <DialogTitle className='text-center text-lg font-medium'>{featureName}</DialogTitle>
        </DialogHeader>
        {children || (
          <ComingSoon featureName={featureName} progress={Math.floor(Math.random() * 30) + 60} />
        )}
        <DialogClose asChild>
          <Button type='button' variant='outline' className='mt-4 w-full'>
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default ComingSoonModal;
