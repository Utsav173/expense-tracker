'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryDelete, categoryGetAll, categoryUpdate } from '@/lib/endpoints/category';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import Loader from '../ui/loader';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { Category as CategoryType } from '@/lib/types';
import UpdateModal from '../modals/update-modal';
import { useToast } from '@/lib/hooks/useToast';
import { Trash2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name must be at least 1 character')
    .max(64, 'Category name must be no more than 64 characters')
    .trim()
});

const CategoryList = () => {
  const [page, setPage] = useState<number>(1); // Initialize page state to 1
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categories', page], // Include page in query key
    queryFn: () =>
      categoryGetAll({
        sortBy: 'createdAt',
        sortOrder: 'asc',
        page: page,
        limit: 10
      }),
    retry: false
  });

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | undefined>(undefined); // Type as CategoryType, use undefined
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const onConformDeleteCategory = async () => {
    try {
      await categoryDelete(selectedCategory!.id);
      setSelectedCategory(undefined); // Use undefined
      showSuccess('Category removed Successfully!');
      refetch();
    } catch (e: any) {
      showError(e.message);
    }
  };

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoryUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('Category updated successfully!');
      setSelectedCategory(undefined); // Use undefined
      setIsUpdateModalOpen(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdate = async (data: any): Promise<void> => {
    if (selectedCategory) {
      await updateCategoryMutation.mutate({ id: selectedCategory.id, data });
    }
  };

  const onHandleChangeModal = (open: boolean, catData?: CategoryType) => {
    setSelectedCategory(catData);
    setIsUpdateModalOpen(open);
  };

  const handlePageChange = (newPage: number) => {
    // Implement handlePageChange function
    setPage(newPage);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <p>Error: {(error as Error).message}</p>;
  }

  return (
    <>
      {data && data.categories && data.categories.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => onHandleChangeModal(true, category)}
                  >
                    <Pencil size={18} />
                  </Button>
                  <DeleteConfirmationModal
                    onOpenChange={(open) => {
                      if (open) setSelectedCategory(category);
                    }}
                    title='Delete Category'
                    triggerButton={
                      <Button size='sm' variant='ghost'>
                        <Trash2 size={18} />
                      </Button>
                    }
                    description='Are you sure you want to delete category, related transaction category data will also affect!'
                    onConfirm={onConformDeleteCategory}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No categories added yet.</p>
      )}

      <UpdateModal
        open={isUpdateModalOpen}
        onOpenChange={onHandleChangeModal}
        title='Update Category'
        triggerButton={<></>}
        submit={handleUpdate}
        description='Please fill in the required information to edit your Category.'
        formSchema={categorySchema}
        defaultValues={selectedCategory} // defaultValues will handle undefined correctly
      >
        <Input type='text' name='name' placeholder='Category Name' className='my-2 w-full' />
      </UpdateModal>

      {/* Pagination Controls */}
      <div className='mt-4 flex justify-center'>
        {data?.pagination && (
          <>
            <Button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              variant='outline'
              size='sm'
              className='mx-1'
            >
              Previous
            </Button>
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  variant={pageNumber === page ? 'default' : 'outline'}
                  size='sm'
                  className='mx-1'
                >
                  {pageNumber}
                </Button>
              )
            )}
            <Button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === data.pagination.totalPages}
              variant='outline'
              size='sm'
              className='mx-1'
            >
              Next
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default CategoryList;
