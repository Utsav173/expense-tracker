'use client';

import { useMutation } from '@tanstack/react-query';
import { categoryCreate, categoryUpdate } from '@/lib/endpoints/category';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const categorySchema = z.object({
  name: z.string().min(3, {
    message: 'Category name must be at least 3 characters.'
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
}

const AddCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onOpenChange,
  onCategoryAdded,
  initialValues,
  categoryId,
  triggerButton
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<CategorySchemaType>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialValues?.name || ''
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategorySchemaType) =>
      categoryId ? categoryUpdate(categoryId, data) : categoryCreate(data),
    onSuccess: async () => {
      await invalidate(['categories']);
      showSuccess(categoryId ? 'Category updated successfully!' : 'Category created successfully!');
      form.reset();
      onCategoryAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleCreate = async (data: CategorySchemaType) => {
    await createCategoryMutation.mutateAsync(data);
  };

  return (
    <AddModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={categoryId ? 'Edit Category' : 'Create Category'}
      description={
        categoryId ? 'Edit your transaction category.' : 'Add an new transaction category.'
      }
      triggerButton={
        triggerButton ||
        (categoryId ? (
          <Button type='button' variant='ghost' className='p-0'>
            Edit
          </Button>
        ) : (
          <Button type='button'>Create Category</Button>
        ))
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl>
                  <Input placeholder='Category name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={createCategoryMutation.isPending}>
            {categoryId ? 'Update' : 'Create'}
          </Button>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddCategoryModal;
