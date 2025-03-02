'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';
import { useCategoryFilters } from '@/components/category/hooks/useCategoryFilters';
import { usePagination } from '@/hooks/usePagination';
import CategoryList from '@/components/category/category-list';
import AddCategoryModal from '@/components/modals/add-category-modal';

const CategoryPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { filters, setSearchQuery, handleSort } = useCategoryFilters();
  const { page, handlePageChange } = usePagination(1, () => {});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      categoryGetAll({
        page,
        q: filters.debouncedSearchQuery,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })
  });

  return (
    <div className='container space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-3xl font-semibold'>Category</h1>
        <AddCategoryModal
          isOpen={isAddModalOpen}
          onOpenChange={() => setIsAddModalOpen(!isAddModalOpen)}
          onCategoryAdded={refetch}
        />
      </div>
      <div>
        <input
          type='text'
          placeholder='Search by category name...'
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {isError && <div>Error: {error.message}</div>}
      <CategoryList
        data={data}
        isLoading={isLoading}
        onSort={handleSort}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        page={page}
        handlePageChange={handlePageChange}
        refetch={refetch}
      />
    </div>
  );
};

export default CategoryPage;
