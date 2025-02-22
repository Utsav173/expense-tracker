'use client';

import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteConfirmationModalProps {
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  triggerButton?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  noTriggerButton?: boolean;
}

const DeleteConfirmationModal = ({
  title,
  description,
  onConfirm,
  triggerButton,
  onOpenChange,
  open,
  noTriggerButton
}: DeleteConfirmationModalProps) => {
  return (
    <Dialog onOpenChange={onOpenChange} {...(noTriggerButton && { open })}>
      {noTriggerButton ? null : <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type='button' onClick={onConfirm}>
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
