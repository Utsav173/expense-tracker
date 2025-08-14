'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { categoryCreate, categoryUpdate } from '@/lib/endpoints/category';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Icon } from '../ui/icon';

type CategorySchemaType = z.infer<typeof apiEndpoints.category.create.body>;

interface CreateCategoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: () => void;
  initialValues?: { name: string };
  categoryId?: string;
  triggerButton?: React.ReactNode;
  noTriggerButton?: boolean;
}

const AddCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onOpenChange,
  onCategoryAdded,
  initialValues,
  categoryId,
  triggerButton,
  noTriggerButton
}) => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<CategorySchemaType>({
    resolver: zodResolver(apiEndpoints.category.create.body),
    defaultValues: {
      name: initialValues?.name || ''
    },
    mode: 'onChange'
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: CategorySchemaType) => {
      try {
        if (categoryId) {
          return await categoryUpdate(categoryId, data);
        }
        return await categoryCreate(data);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        throw new Error(errorMessage);
      }
    },
    onSuccess: async () => {
      await invalidate(['categories']);
      handleModalClose();
    },
    onError: (error: Error) => {
      showError(error.message);
    }
  });

  const handleModalClose = () => {
    form.reset();
    onCategoryAdded();
    onOpenChange(false);
  };

  const onSubmit = async (data: CategorySchemaType) => {
    try {
      await mutateAsync(data);
    } catch (error) {
      console.error('Failed to handle category operation:', error);
    }
  };

  const isSubmitDisabled = isPending || !form.formState.isValid;

  return (
    <AddModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          handleModalClose();
        }
        onOpenChange(open);
      }}
      title={categoryId ? 'Edit Category' : 'Create Category'}
      description={
        categoryId ? 'Edit your transaction category.' : 'Add a new transaction category.'
      }
      triggerButton={
        noTriggerButton
          ? null
          : triggerButton || (
              <Button className='w-full sm:w-auto'>
                {categoryId ? 'Edit Category' : 'Create Category'}
              </Button>
            )
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6' autoComplete='off'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., Groceries, Utilities'
                    {...field}
                    disabled={isPending}
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitDisabled} className='min-w-[100px]'>
              {isPending ? (
                <>
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
                  {categoryId ? 'Updating...' : 'Creating...'}
                </>
              ) : categoryId ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddCategoryModal;
