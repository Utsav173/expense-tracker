import React from 'react';
import { Category } from '@/lib/types';
import { Button } from '../ui/button';
import { Edit, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';

interface CategoryActionsProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

const CategoryActions: React.FC<CategoryActionsProps> = ({ category, onEdit, onDelete }) => {
  return (
    <div className='flex justify-end gap-2'>
      <Button
        type='button'
        variant='ghost'
        className='p-0'
        onClick={() => onEdit(category)}
        aria-label={`Edit ${category.name}`}
      >
        <Edit size={18} />
      </Button>
      <DeleteConfirmationModal
        title='Delete Category'
        description={`Are you sure you want to delete ${category.name} category?`}
        triggerButton={
          <Button
            type='button'
            variant='ghost'
            className='p-0'
            aria-label={`Delete ${category.name}`}
          >
            <Trash2 size={18} />
          </Button>
        }
        onConfirm={() => onDelete(category.id)}
      />
    </div>
  );
};

export default CategoryActions;
