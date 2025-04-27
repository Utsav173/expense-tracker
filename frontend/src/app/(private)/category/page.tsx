'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';
import { useCategoryFilters } from '@/components/category/hooks/useCategoryFilters';
import { usePagination } from '@/hooks/usePagination';
import CategoryList from '@/components/category/category-list';
import AddCategoryModal from '@/components/modals/add-category-modal';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';

const CategoryPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { filters, setSearchQuery, handleSort } = useCategoryFilters();

  const { page, handlePageChange } = usePagination(
    Number(searchParams.get('page')) || 1,
    (params) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          currentParams.delete(key);
        } else {
          currentParams.set(key.toString(), params[key]);
        }
      });
      const newUrl = `${pathname}?${currentParams.toString()}`;

      router.push(newUrl, { scroll: false });
    }
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories', page, filters.debouncedSearchQuery, filters.sortBy, filters.sortOrder],
    queryFn: () =>
      categoryGetAll({
        page,
        search: filters.debouncedSearchQuery,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })
  });

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-3xl font-semibold'>Category</h1>
        <AddCategoryModal
          isOpen={isAddModalOpen}
          onOpenChange={() => setIsAddModalOpen(!isAddModalOpen)}
          onCategoryAdded={refetch}
        />
      </div>
      <div>
        <Input
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
