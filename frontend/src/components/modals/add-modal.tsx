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

interface AddModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  triggerButton: ReactNode;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  hideClose?: boolean;
}

const AddModal = ({
  children,
  title,
  description,
  triggerButton,
  isOpen,
  onOpenChange,
  hideClose = false
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
          <span onClick={handleTriggerClick} style={{ display: 'contents' }}>
            {triggerButton}
          </span>
        </DialogTrigger>
      )}
      <DialogContent
        id={id}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        className='mx-auto w-full max-w-[95vw] overflow-hidden sm:max-w-[425px]'
        hideClose={hideClose}
      >
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
