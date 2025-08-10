'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Loader2, Pencil } from 'lucide-react';

interface UpdateModalProps<TFormValues extends z.ZodType<any, any>> {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValues: z.infer<TFormValues>;
  validationSchema: TFormValues;
  updateFn: (id: string, data: z.infer<TFormValues>) => Promise<any>;
  invalidateKeys: string[][];
  onSuccess?: () => void;
  children: (form: any) => React.ReactNode;
  entityId: string;
}

export function UpdateModal<TFormValues extends z.ZodType<any, any>>({
  isOpen,
  onOpenChange,
  title,
  description,
  initialValues,
  validationSchema,
  updateFn,
  invalidateKeys,
  onSuccess,
  children,
  entityId
}: UpdateModalProps<TFormValues>) {
  const { showError, showSuccess } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<z.infer<TFormValues>>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
    mode: 'onChange'
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(initialValues);
    }
  }, [isOpen, initialValues, form]);

  const mutation = useMutation({
    mutationFn: (data: z.infer<TFormValues>) => updateFn(entityId, data),
    onSuccess: async () => {
      for (const key of invalidateKeys) {
        await invalidate(key);
      }
      showSuccess('Successfully updated.');
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to update.';
      showError(message);
    }
  });

  const onSubmit = (values: z.infer<TFormValues>) => {
    mutation.mutate(values);
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90dvh] w-[50vw] max-w-[95vw] overflow-y-auto max-sm:w-full'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil className='h-5 w-5' />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 pt-2'>
            {children(form)}
            <DialogFooter className='gap-2 pt-4 sm:gap-0'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={mutation.isPending || !form.formState.isValid || !form.formState.isDirty}
                className='min-w-[120px]'
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
