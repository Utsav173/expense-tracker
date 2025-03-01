import { Category } from '@/lib/types';
import { TableCell, TableRow } from '../ui/table';
import AddCategoryModal from '../modals/add-category-modal';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryDelete } from '@/lib/endpoints/category';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useToast } from '@/lib/hooks/useToast';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface CategoryRowProps {
  category: Category;
  onCategoryDeleted: () => void;
}

const CategoryRow = ({ category, onCategoryDeleted }: CategoryRowProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess('Category deleted successfully!');
      onCategoryDeleted();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  return (
    <TableRow>
      <TableCell className='font-medium'>{category.name}</TableCell>
      <TableCell className='text-right'>
        <div className='flex justify-end gap-2'>
          <AddCategoryModal
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onCategoryAdded={() => {}}
            initialValues={{ name: category.name }}
            categoryId={category.id}
          />
          <DeleteConfirmationModal
            title='Delete Category'
            description='Are you sure you want to delete this category?'
            triggerButton={
              <Button type='button' variant='ghost' className='p-0'>
                <Trash2 size={18} />
              </Button>
            }
            onConfirm={() => deleteCategoryMutation.mutate(category.id)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CategoryRow;
