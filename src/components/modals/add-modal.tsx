'use client';

import React, { ReactNode, useId } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AddModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  triggerButton: ReactNode;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  hideClose?: boolean;
  icon?: React.ReactNode;
  iconClassName?: string;
}

const AddModal = ({
  children,
  title,
  description,
  triggerButton,
  isOpen,
  onOpenChange,
  hideClose = false,
  icon,
  iconClassName
}: AddModalProps) => {
  const id = useId();

  const handleTriggerClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenChange) {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} key={id + 'dialog'}>
      {triggerButton && (
        <DialogTrigger asChild>
          <div onClick={handleTriggerClick} style={{ display: 'contents' }}>
            {triggerButton}
          </div>
        </DialogTrigger>
      )}
      <DialogContent
        id={id}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        className='max-h-[90dvh] w-[50vw] max-w-[95vw] overflow-y-auto max-sm:w-full'
        hideClose={hideClose}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {icon && <div className={cn('rounded-full p-2', iconClassName)}>{icon}</div>}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default AddModal;
