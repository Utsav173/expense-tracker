'use client';

import React, { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';
import CategoryList from '@/components/category/category-list';
import { usePagination } from '@/hooks/usePagination';
import { useRouter } from 'next/navigation';
import AddCategoryModal from '@/components/modals/add-category-modal';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { useCategoryFilters } from '@/components/category/hooks/useCategoryFilters';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

const CategoryPage = ({ searchParams }: PageProps) => {
  const unwrappedSearchParams = use(searchParams);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { filters, setSearchQuery, handleSort, updateURL } =
    useCategoryFilters(unwrappedSearchParams);

  const { page, handlePageChange } = usePagination(
    Number(unwrappedSearchParams.page) || 1,
    updateURL
  );

  const [debouncedSearch] = useDebounce(filters.searchQuery, 300);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['categories', debouncedSearch, page, filters.sortBy, filters.sortOrder],
    queryFn: () =>
      categoryGetAll({
        page: page,
        limit: 10,
        q: debouncedSearch,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }),
    retry: false
  });

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='pb-3 text-xl font-bold'>Categories</h1>
        <AddCategoryModal
          isOpen={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onCategoryAdded={refetch}
        />
      </div>
      <div className='py-4'>
        <Input
          type='text'
          placeholder='Search categories...'
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full rounded-md border border-gray-300 p-2'
        />
      </div>
      <CategoryList
        data={data}
        isLoading={isLoading}
        onSort={handleSort}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        page={page}
        handlePageChange={handlePageChange}
      />
    </div>
  );
};

export default CategoryPage;
