'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetGetAll, budgetDelete, budgetUpdate } from '@/lib/endpoints/budget';
import Loader from '../ui/loader';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useToast } from '@/lib/hooks/useToast';
import { Pencil, Trash2 } from 'lucide-react';
import { Budget as BudgetType } from '@/lib/types';
import UpdateModal from '../modals/update-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

// Define budgetSchema directly here
export const budgetSchema = z.object({
  amount: z.string().refine((value) => !isNaN(Number(value)), {
    message: 'Amount must be a valid number'
  })
});

const BudgetList = () => {
  const [page, setPage] = useState(1);
  const { showError, showSuccess } = useToast();
  const [selectedBudget, setSelectedBudget] = useState<BudgetType | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: budgets,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['budgets', page],
    queryFn: () => budgetGetAll('all', { page, limit: 10 }),
    retry: false
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => budgetUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); // Correct key
      showSuccess('Budget updated successfully!');
      setSelectedBudget(null); // Clear selection
      setIsUpdateModalOpen(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdate = async (data: any): Promise<void> => {
    if (selectedBudget) {
      await updateBudgetMutation.mutate({ id: selectedBudget.id, data });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDelete = async (id: string) => {
    try {
      await budgetDelete(id);
      showSuccess('Budget deleted successfully!');
      refetch(); // Refetch data after successful deletion
    } catch (e: any) {
      showError(e.message);
    }
  };

  const onHandleChangeModal = (open: boolean, budgetData?: BudgetType) => {
    // Correct type for budgetData
    setSelectedBudget(budgetData || null); // Handle null case
    setIsUpdateModalOpen(open);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Error fetching budgets: {(error as Error).message}</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets?.data?.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell>{budget.category.name}</TableCell>
              <TableCell>{budget.month}</TableCell>
              <TableCell>{budget.year}</TableCell>
              <TableCell>{budget.amount}</TableCell>
              <TableCell>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    setSelectedBudget(budget); // Set the selected budget
                    onHandleChangeModal(true, budget); // Open the modal and pass budget data
                  }}
                >
                  <Pencil size={18} />
                </Button>
                <DeleteConfirmationModal
                  onOpenChange={(open) => {
                    if (open) setSelectedBudget(budget);
                  }}
                  title='Delete Budget'
                  triggerButton={
                    <Button size='sm' variant='ghost'>
                      <Trash2 size={18} />
                    </Button>
                  }
                  description='Are you sure you want to delete budget, related budget data will also affect!'
                  onConfirm={() => handleDelete(budget.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className='mt-4 flex justify-center'>
        {budgets?.pagination && (
          <>
            <Button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              variant='outline'
              size='sm'
              className='mx-1'
            >
              Previous
            </Button>
            {Array.from({ length: budgets.pagination.totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  variant={pageNumber === page ? 'default' : 'outline'}
                  size='sm'
                  className='mx-1'
                >
                  {pageNumber}
                </Button>
              )
            )}
            <Button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === budgets.pagination.totalPages}
              variant='outline'
              size='sm'
              className='mx-1'
            >
              Next
            </Button>
          </>
        )}
      </div>
      {selectedBudget && (
        <UpdateModal
          title='Edit Budget'
          formSchema={budgetSchema}
          defaultValues={{
            ...selectedBudget,
            amount: selectedBudget.amount
          }}
          triggerButton={<></>}
          description='Update your budget information.'
          submit={handleUpdate}
          onOpenChange={onHandleChangeModal}
          open={isUpdateModalOpen}
        >
          {/* Form fields directly inside UpdateModal */}
          <div className='space-y-4'>
            <div>
              <Label htmlFor='amount'>Amount</Label>
              <Input
                type='text'
                id='amount'
                name='amount'
                placeholder='Budget Amount'
                className='w-full'
              />
            </div>
          </div>
        </UpdateModal>
      )}
    </>
  );
};

export default BudgetList;
