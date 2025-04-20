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
      <DialogContent hideClose={hideClose}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default AddModal;
