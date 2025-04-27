'use client';

import React, { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface AddModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  triggerButton: ReactNode;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  hideClose?: boolean;
}

const AddModal: React.FC<AddModalProps> = ({
  title,
  description,
  children,
  triggerButton,
  onOpenChange,
  isOpen,
  hideClose = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className='mx-auto w-full max-w-[95vw] sm:max-w-[425px]' hideClose={hideClose}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className='max-h-[80vh] overflow-y-auto'>{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default AddModal;
