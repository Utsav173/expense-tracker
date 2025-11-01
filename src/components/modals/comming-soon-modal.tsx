'use client';

import React, { Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import ComingSoon from '@/components/ui/coming-soon';
import { Button } from '../ui/button';
import Loader from '../ui/loader';

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
      <DialogContent>
        <DialogHeader className='mb-4'>
          <DialogTitle className='text-center text-lg font-medium'>{featureName}</DialogTitle>
        </DialogHeader>
        <Suspense fallback={<Loader />}>
          {children || <ComingSoon featureName={featureName} />}
        </Suspense>
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
