'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Repeat, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import UpdateTransactionModal from './modals/update-transaction-modal';
import DeleteConfirmationModal from './modals/delete-confirmation-modal';
import { transactionDelete } from '@/lib/endpoints/transactions';
import { useToast } from '@/lib/hooks/useToast';
import { Transaction as TransactionType } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import CommonTable from './ui/CommonTable';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TransactionTableProps {
  transactions: TransactionType[] | undefined;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  totalRecords: number;
  page: number;
  handlePageChange: (page: number) => void;
  refetchData: () => Promise<void>;
}

const TransactionTable = ({
  transactions,
  onSort,
  sortBy,
  sortOrder,
  loading,
  totalRecords,
  page,
  handlePageChange,
  refetchData
}: TransactionTableProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const deleteMutation = useMutation({
    mutationFn: transactionDelete,
    onSuccess: async () => {
      await refetchData();
      showSuccess('Transaction deleted successfully!');
      setDeleteTransactionId(null);
    },
    onError: (error: any) => {
      showError(error.message);
      setDeleteTransactionId(null);
    }
  });

  const handleDelete = async () => {
    if (deleteTransactionId) {
      deleteMutation.mutateAsync(deleteTransactionId);
    }
  };

  const handleEditClick = (transaction: TransactionType) => {
    setSelectedTransaction(transaction);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTransactionId(id);
  };

  const columns = useMemo<ColumnDef<TransactionType>[]>(
    () => [
      {
        accessorKey: 'text',
        header: 'Description / Transfer',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='max-w-[200px] truncate font-medium'>{row.original.text}</span>
            {row.original.transfer && (
              <span className='max-w-[200px] truncate text-xs text-muted-foreground'>
                via {row.original.transfer}
              </span>
            )}
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const transaction = row.original;
          const sign = transaction.isIncome ? '+' : '-';
          return (
            <div
              className={cn(
                'min-w-fit font-medium',
                transaction.isIncome ? 'text-green-600' : 'text-red-600'
              )}
            >
              {sign}
              {formatCurrency(transaction.amount, transaction.currency)}
            </div>
          );
        },
        enableSorting: true
      },
      {
        accessorKey: 'category.name',
        header: 'Category',
        cell: ({ row }) => (
          <Badge variant='outline' className='max-w-[150px] truncate whitespace-nowrap'>
            {row.original.category?.name ?? 'Uncategorized'}
          </Badge>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className='whitespace-nowrap text-sm'>
              {format(date, 'MMM d, yyyy')}
              <span className='ml-2 text-xs text-muted-foreground'>{format(date, 'h:mm a')}</span>
            </div>
          );
        },
        enableSorting: true
      },
      {
        accessorKey: 'isIncome',
        header: 'Type',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            {row.original.isIncome ? (
              <ArrowUpCircle className='h-4 w-4 text-green-500' />
            ) : (
              <ArrowDownCircle className='h-4 w-4 text-red-500' />
            )}
            <span className='text-sm'>{row.original.isIncome ? 'Income' : 'Expense'}</span>
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'recurring',
        header: 'Recurring',
        cell: ({ row }) => {
          const transaction = row.original;
          if (!transaction.recurring) return null;

          const tooltipContent = `Type: ${transaction.recurrenceType || 'N/A'} ${
            transaction.recurrenceEndDate
              ? ` | Ends: ${format(new Date(transaction.recurrenceEndDate), 'MMM d, yyyy')}`
              : ''
          }`;

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Repeat className='h-4 w-4 text-blue-500' />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipContent}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: 'createdBy.name',
        header: 'Created By',
        cell: ({ row }) => (
          <div className='max-w-[120px] truncate text-sm'>
            {row.original.createdBy?.name ?? 'N/A'}
          </div>
        ),
        enableSorting: false
      },
      {
        id: 'actions',
        header: () => <div className='text-right'>Actions</div>,
        cell: ({ row }) => (
          <div className='flex justify-end gap-1'>
            <Button size='icon' variant='ghost' onClick={() => handleEditClick(row.original)}>
              <Pencil className='h-4 w-4' />
              <span className='sr-only'>Edit</span>
            </Button>
            <DeleteConfirmationModal
              title='Delete Transaction'
              description={
                <p>
                  Are you sure you want to delete this transaction? <br />
                  <span className='font-medium'>{row.original.text}</span>
                  <br />
                  <span
                    className={cn(
                      row.original.isIncome ? 'text-green-600' : 'text-red-600',
                      'font-semibold'
                    )}
                  >
                    {row.original.isIncome ? '+' : '-'}
                    {formatCurrency(row.original.amount, row.original.currency)}
                  </span>
                </p>
              }
              onConfirm={handleDelete}
              open={deleteTransactionId === row.original.id}
              onOpenChange={(open) => !open && setDeleteTransactionId(null)}
              triggerButton={
                <Button
                  size='icon'
                  variant='ghost'
                  className='text-destructive hover:text-destructive'
                  onClick={() => handleDeleteClick(row.original.id)}
                >
                  <Trash2 className='h-4 w-4' />
                  <span className='sr-only'>Delete</span>
                </Button>
              }
            />
          </div>
        )
      }
    ],
    []
  );

  const handleSortChange = useCallback(
    (sorting: SortingState) => {
      if (sorting.length > 0) {
        const sort = sorting[0];
        onSort(sort.id, sort.desc ? 'desc' : 'asc');
      } else {
        onSort('createdAt', 'desc');
      }
    },
    [onSort]
  );

  return (
    <>
      <CommonTable
        data={transactions || []}
        columns={columns}
        loading={loading}
        totalRecords={totalRecords}
        pageSize={10}
        currentPage={page}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        enablePagination={true}
        sortBy={sortBy}
        sortOrder={sortOrder}
        mobileTriggerColumns={['text', 'amount']}
      />
      <UpdateTransactionModal
        isOpen={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        transaction={selectedTransaction}
        onUpdate={async () => {
          await refetchData();
        }}
      />
    </>
  );
};

export default TransactionTable;
