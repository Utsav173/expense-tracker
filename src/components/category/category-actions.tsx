import React from 'react';
import type { CategoryAPI } from '@/lib/api/api-types';
import { Button } from '../ui/button';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { Icon } from '@/components/ui/icon';

interface CategoryActionsProps {
  category: CategoryAPI.Category;
  onEdit: (category: CategoryAPI.Category) => void;
  onDelete: (id: string) => void;
}

const CategoryActions: React.FC<CategoryActionsProps> = ({ category, onEdit, onDelete }) => {
  return (
    <div className='flex w-full justify-end gap-2'>
      <Button
        type='button'
        variant='ghost'
        onClick={() => onEdit(category)}
        aria-label={`Edit ${category.name}`}
      >
        <Icon name='edit' className='h-4 w-4' />
      </Button>
      <DeleteConfirmationModal
        title='Delete Category'
        description={`Are you sure you want to delete ${category.name} category?`}
        triggerButton={
          <Button type='button' variant='ghost' aria-label={`Delete ${category.name}`}>
            <Icon name='trash2' className='h-4 w-4' />
          </Button>
        }
        onConfirm={() => onDelete(category.id)}
      />
    </div>
  );
};

export default CategoryActions;
