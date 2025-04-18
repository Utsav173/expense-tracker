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

interface UpdateModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  triggerButton: ReactNode;
  onOpenChange?: (open: boolean) => void;
}

const UpdateCommonModal = ({
  title,
  description,
  children,
  triggerButton,
  onOpenChange
}: UpdateModalProps) => {
  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateCommonModal;
