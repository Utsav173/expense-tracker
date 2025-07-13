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
import { Loader2 } from 'lucide-react';

const categorySchema = z.object({
  name: z
    .string()
    .min(3, 'Category name must be at least 3 characters')
    .max(50, 'Category name cannot exceed 50 characters')
    .trim()
    .refine((value) => /^[a-zA-Z0-9\s-_]+$/.test(value), {
      message: 'Category name can only contain letters, numbers, spaces, hyphens, and underscores'
    })
});

type CategorySchemaType = z.infer<typeof categorySchema>;

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting }
  } = useForm<CategorySchemaType>({
    resolver: zodResolver(categorySchema),
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
    reset();
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

  const isSubmitDisabled = isPending || !isValid;

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
              <Button type='button' variant='outline' className='w-full sm:w-auto'>
                {categoryId ? 'Edit Category' : 'Create Category'}
              </Button>
            )
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' autoComplete='off'>
        <div className='space-y-2'>
          <Input
            id='category-name'
            placeholder='e.g., Groceries, Utilities'
            {...register('name')}
            disabled={isPending}
            className='mt-2'
            autoFocus
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'category-name-error' : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!isSubmitDisabled) {
                  handleSubmit(onSubmit)();
                }
              }
            }}
          />
          {errors.name && (
            <p id='category-name-error' className='text-destructive text-xs font-medium'>
              {errors.name.message}
            </p>
          )}
        </div>
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
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
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
    </AddModal>
  );
};

export default AddCategoryModal;
