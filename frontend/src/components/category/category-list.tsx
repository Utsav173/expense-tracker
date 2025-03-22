'use client';

import React, { useMemo, useState } from 'react';
import CommonTable from '../ui/CommonTable';
import { ApiResponse, Category } from '@/lib/types';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryDelete } from '@/lib/endpoints/category';
import AddCategoryModal from '../modals/add-category-modal';
import { useToast } from '@/lib/hooks/useToast';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { Button } from '../ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface CategoryListProps {
  data:
    | ApiResponse<{
        categories: Category[];
        pagination: any;
      }>
    | undefined;
  isLoading: boolean;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  handlePageChange: (page: number) => void;
  refetch: () => void;
}

const CategoryList = ({
  data,
  isLoading,
  onSort,
  sortBy,
  sortOrder,
  page,
  handlePageChange,
  refetch
}: CategoryListProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('Category deleted successfully!');
      refetch();
      setDeleteCategoryId(null);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleDelete = async () => {
    if (deleteCategoryId) {
      deleteCategoryMutation.mutate(deleteCategoryId);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteCategoryId(id);
  };

  const columns: ColumnDef<Category>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Category'
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              className='p-0'
              onClick={() => handleEdit(row.original)}
            >
              <Edit size={18} />
            </Button>
            <DeleteConfirmationModal
              title='Delete Category'
              description='Are you sure you want to delete this category?'
              triggerButton={
                <Button type='button' variant='ghost' className='p-0'>
                  <Trash2 size={18} />
                </Button>
              }
              onConfirm={() => handleDeleteClick(row.original.id)}
            />
          </div>
        )
      }
    ],
    []
  );

  const handleSortChange = (sorting: SortingState) => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      onSort(sort.id, sort.desc ? 'desc' : 'asc');
    }
  };

  return (
    <>
      <CommonTable
        data={data?.categories || []}
        columns={columns}
        loading={isLoading}
        totalRecords={data?.pagination?.total || 0}
        pageSize={10}
        currentPage={page}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        enablePagination={true}
        mobileTriggerColumns={['name']}
      />

      {selectedCategory && (
        <AddCategoryModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onCategoryAdded={refetch}
          initialValues={{ name: selectedCategory.name }}
          categoryId={selectedCategory.id}
        />
      )}

      <DeleteConfirmationModal
        title='Delete Category'
        description={
          selectedCategory ? (
            <>
              Are you sure you want to delete <b>{selectedCategory.name}</b> category?
            </>
          ) : (
            ''
          )
        }
        onConfirm={handleDelete}
        open={!!deleteCategoryId}
        onOpenChange={() => setDeleteCategoryId(null)}
      />
    </>
  );
};

export default CategoryList;
