'use client';

import React, { useMemo, useState, useCallback } from 'react';
import CommonTable from '../ui/CommonTable';
import { Category, CategoryListResponse } from '@/types/category';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { useMutation } from '@tanstack/react-query';
import { categoryDelete } from '@/lib/endpoints/category';
import AddCategoryModal from '../modals/add-category-modal';
import { useToast } from '@/lib/hooks/useToast';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import CategoryActions from './category-actions';

interface CategoryListProps {
  data: CategoryListResponse | undefined;
  isLoading: boolean;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  handlePageChange: (page: number) => void;
  refetch: () => void;
}

const CategoryList = React.memo(
  ({
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
    const invalidate = useInvalidateQueries();
    const { showSuccess, showError } = useToast();

    const deleteCategoryMutation = useMutation({
      mutationFn: (id: string) => categoryDelete(id),
      onSuccess: async () => {
        await invalidate(['categories']);
        showSuccess('Category deleted successfully!');
        refetch();
        setDeleteCategoryId(null);
      },
      onError: (error: any) => {
        showError(error.message);
      }
    });

    const handleDelete = useCallback(async () => {
      if (deleteCategoryId) {
        deleteCategoryMutation.mutate(deleteCategoryId);
      }
    }, [deleteCategoryId, deleteCategoryMutation]);

    const handleEdit = useCallback((category: Category) => {
      setSelectedCategory(category);
      setIsEditModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((id: string) => {
      setDeleteCategoryId(id);
    }, []);

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
            <CategoryActions
              category={row.original}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )
        }
      ],
      [handleEdit, handleDeleteClick]
    );

    const handleSortChange = useCallback(
      (sorting: SortingState) => {
        if (sorting.length > 0) {
          const sort = sorting[0];
          onSort(sort.id, sort.desc ? 'desc' : 'asc');
        }
      },
      [onSort]
    );

    return (
      <>
        <CommonTable
          data={data?.categories || []}
          columns={columns}
          loading={isLoading}
          totalRecords={data?.pagination.total || 0}
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
            noTriggerButton={true}
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
  }
);

CategoryList.displayName = 'CategoryList';

export default CategoryList;
