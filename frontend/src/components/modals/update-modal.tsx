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
import { Button } from '@/components/ui/button';
import { Path, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';

interface UpdateModalProps<T extends z.ZodRawShape = any, U = any> {
  title: string;
  description: string;
  children: ReactNode;
  triggerButton: ReactNode;
  onOpenChange?: (open: boolean, data?: U) => void;
  formSchema: z.ZodObject<T>;
  submit: (value: z.infer<z.ZodObject<T>>) => Promise<void>;
  defaultValues?: U;
  open?: boolean;
}

interface InputProps extends React.ComponentProps<'input'> {}

const UpdateModal = <T extends z.ZodRawShape, U = any>({
  title,
  description,
  children,
  triggerButton,
  formSchema,
  submit,
  onOpenChange,
  defaultValues,
  open
}: UpdateModalProps<T, U>) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<z.infer<z.ZodObject<T>>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as any
  });

  const { showError } = useToast();

  const onCancelModal = () => {
    reset(defaultValues as any);
    onOpenChange?.(false, undefined);
  };

  const submitAction = async (data: z.infer<z.ZodObject<T>>) => {
    try {
      await submit(data);
    } catch (e: any) {
      showError(e.message);
    } finally {
      onOpenChange?.(false, undefined);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange?.(open, open ? defaultValues : undefined);
      }}
    >
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitAction)}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement<InputProps>(child) && child.type === Input) {
              const inputProps = child.props as InputProps & { name: string };
              return (
                <div className='mb-2'>
                  {React.cloneElement(child, {
                    ...inputProps,
                    ...register(inputProps.name as Path<z.infer<z.ZodObject<T>>>, {
                      value: inputProps.value as any
                    })
                  })}
                  {errors[inputProps.name as keyof z.infer<z.ZodObject<T>>] && (
                    <p className='mt-1 text-sm text-red-500'>
                      {String(errors[inputProps.name as keyof z.infer<z.ZodObject<T>>]?.message)}
                    </p>
                  )}
                </div>
              );
            }
            return child;
          })}

          <div className='mt-4 flex items-center justify-end gap-2'>
            <Button size='sm' type='submit'>
              Save changes
            </Button>
            <Button variant='outline' onClick={onCancelModal} type='button' size='sm'>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateModal;
