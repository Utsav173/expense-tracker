// File: src/app/category/page.tsx  ( complete component)

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  categoryGetAll,
  categoryCreate,
  categoryDelete,
  categoryUpdate
} from '@/lib/endpoints/category';
import React, { useState, useEffect } from 'react';
import AddModal from '@/components/modals/add-modal';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import UpdateModal from '@/components/modals/update-modal';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import Loader from '@/components/ui/loader';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/lib/hooks/useToast';
import { Trash2, Pencil } from 'lucide-react';
import { Category } from '@/lib/types'; //import Category

const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name must be at least 1 character') // Improved error messages
    .max(64, 'Category name must be no more than 64 characters')
    .trim()
});

type CategoryFormSchema = z.infer<typeof categorySchema>;

const CategoryPage = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      categoryGetAll({
        // remove {}
        sortBy: 'createdAt',
        sortOrder: 'asc',
        page: 1,
        limit: 10
      }),
    retry: false // Good practice to disable retries on failure unless you have a specific reason.
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null); //  Use a state for storing selected item for "edit".
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CategoryFormSchema>({
    resolver: zodResolver(categorySchema)
  });

  const handleCreateCategory = async (formData: CategoryFormSchema) => {
    try {
      await categoryCreate(formData); //calling api
      setIsAddModalOpen(false); // Close the modal
      showSuccess('Category added successfully!');
      refetch();
      reset(); //reset value once done
    } catch (e: any) {
      showError(e.message);
    }
  };

  // Form handling for *updating* categories (UpdateModal)
  const {
    register: updateRegister,
    handleSubmit: handleUpdateSubmit,
    setValue,
    formState: { errors: updateErrors },
    reset: resetForm
  } = useForm<CategoryFormSchema>({
    resolver: zodResolver(categorySchema)
  });

  // Pre-fill the update form when a category is selected for editing.
  useEffect(() => {
    if (selectedCategory) {
      setValue('name', selectedCategory.name);
    }
  }, [selectedCategory, setValue]);

  const handleEditCategory = async (formData: CategoryFormSchema) => {
    // Changed argument type

    try {
      await categoryUpdate(selectedCategory.id, formData);
      refetch();
      setIsUpdateModalOpen(false);
      showSuccess('Category updated successfully!');

      setSelectedCategory(null); //clean after updates.
    } catch (e: any) {
      showError(e.message);
    }
  };

  const onConformDeleteCategory = async () => {
    try {
      await categoryDelete(selectedCategory.id);
      setSelectedCategory(null); // clean after delete operations.
      showSuccess('Category removed Successfully!');
      refetch();
    } catch (e: any) {
      showError(e.message);
    }
  };

  // Open the UpdateModal with data
  const onHandleChangeModal = (open: boolean, catData: any) => {
    setSelectedCategory(catData);
    setIsUpdateModalOpen(open);
    if (!open) {
      resetForm(); // reset the updateform.
    }
  };

  const handleCategoryModal = () => {
    setIsAddModalOpen(true);
    reset(); // clean for
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <p>Error: {(error as Error).message}</p>; //cast type error.
  }

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='pb-3 text-xl font-bold'>Categories</h1>
        <AddModal
          title='Create New Category'
          triggerButton={<Button onClick={handleCategoryModal}> Create Category </Button>}
          onOpenChange={setIsAddModalOpen}
          isOpen={isAddModalOpen}
        >
          <form onSubmit={handleSubmit(handleCreateCategory)}>
            <Input
              type='text'
              placeholder='Category Name'
              {...register('name')}
              className='w-full'
            />
            {errors.name && <p className='mt-1 text-sm text-red-500'>{errors.name.message}</p>}

            <Button type='submit' className='mt-4 w-full'>
              Create
            </Button>
          </form>
        </AddModal>
      </div>
      {data && data.categories && data.categories.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.categories.map(
              (
                category: Category // :Category
              ) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => onHandleChangeModal(true, category)}
                    >
                      {' '}
                      <Pencil size={18} />
                    </Button>
                    <DeleteConfirmationModal
                      onOpenChange={(open) => {
                        if (open) setSelectedCategory(category);
                      }}
                      title='Delete Category'
                      triggerButton={
                        <Button size='sm' variant='ghost'>
                          {' '}
                          <Trash2 size={18} />
                        </Button>
                      }
                      description='Are you sure you want to delete category, related transaction category data will also affect!'
                      onConfirm={onConformDeleteCategory}
                    />
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      ) : (
        <p>No categories added yet.</p>
      )}

      <UpdateModal
        open={isUpdateModalOpen}
        onOpenChange={onHandleChangeModal}
        title='Update Category'
        triggerButton={<></>} // as button will be manully handling to avoid any mis-leading.
        submit={(value: { name: string }) => handleUpdateSubmit(() => handleEditCategory(value))()}
        description='Please fill in the required information to edit your Category.'
        formSchema={categorySchema} //passed
        defaultValues={selectedCategory} // for set initial
      >
        <Input type='text' placeholder='Category Name' {...updateRegister('name')} />

        {updateErrors.name && <p className='text-sm text-red-500'> {updateErrors.name.message} </p>}
      </UpdateModal>
    </div>
  );
};

export default CategoryPage;
