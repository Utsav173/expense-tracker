'use client';

import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';
import React, { useState } from 'react';
import CategoryList from '@/components/category/category-list';
import AddModal from '@/components/modals/add-modal';
import { Button } from '@/components/ui/button';

const CategoryPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      categoryGetAll({
        sortBy: 'createdAt',
        sortOrder: 'asc',
        page: 1,
        limit: 10
      }),
    retry: false
  });

  const handleCategoryModal = () => {
    setIsAddModalOpen(true);
  };

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
          {/* Remove CategoryForm here - we will handle form inside AddModal if needed, or create a new simpler form */}
          {/* <CategoryForm onCategoryAdded={refetch} isAdd={true} /> */}
          <div>
            Category creation form will go here if needed, or remove AddModal if category creation
            is handled elsewhere. For now, let's leave it empty or remove AddModal if not needed.
          </div>
        </AddModal>
      </div>
      <CategoryList />
    </div>
  );
};

export default CategoryPage;
