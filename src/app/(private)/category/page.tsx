'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';
import CategoryList from '@/components/category/category-list';
import AddCategoryModal from '@/components/modals/add-category-modal';
import { Input } from '@/components/ui/input';
import type { CategoryAPI } from '@/lib/api/api-types';
import { Button } from '@/components/ui/button';
import { useUrlState } from '@/hooks/useUrlState';
import { Icon } from '@/components/ui/icon';

const initialUrlState = {
  page: 1,
  q: '',
  sortBy: 'createdAt',
  sortOrder: 'asc' as 'asc' | 'desc'
};

const CategoryPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { state, setState, handlePageChange, searchQuery, setSearchQuery } =
    useUrlState(initialUrlState);

  const { data, isLoading, isError, error, refetch } = useQuery<CategoryAPI.GetCategoriesResponse>({
    queryKey: ['categories', state.page, state.q, state.sortBy, state.sortOrder],
    queryFn: () =>
      categoryGetAll({
        page: state.page,
        limit: 10,
        search: state.q,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
  });

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setState({ sortBy, sortOrder, page: 1 });
  };

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-3xl font-semibold'>Category</h1>
        <AddCategoryModal
          isOpen={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onCategoryAdded={refetch}
          triggerButton={
            <Button variant='category' className='h-10 px-4 py-2'>
              <Icon name='tag' className='mr-2 h-4 w-4' />
              Create Category
            </Button>
          }
        />
      </div>
      <div className='relative flex-1'>
        <Icon
          name='search'
          className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
        />
        <Input
          type='text'
          placeholder='Search by category name...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-9'
        />
      </div>
      {isError && <div>Error: {error.message}</div>}
      <CategoryList
        tableId='categories-table'
        data={data}
        isLoading={isLoading}
        onSort={handleSort}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        page={state.page}
        handlePageChange={handlePageChange}
        refetch={refetch}
      />
    </div>
  );
};

export default CategoryPage;
