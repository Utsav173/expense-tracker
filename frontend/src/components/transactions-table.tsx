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
import { SingleLineEllipsis } from './ui/ellipsis-components';

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
          <div className='flex flex-col space-y-1'>
            <SingleLineEllipsis
              showTooltip
              className='text-sm font-medium max-md:max-w-[200px] md:max-w-[250px] md:text-base'
            >
              {row.original.text}
            </SingleLineEllipsis>
            {row.original.transfer && (
              <SingleLineEllipsis
                showTooltip
                className='text-muted-foreground text-xs max-md:max-w-[200px] md:max-w-[250px]'
              >
                via {row.original.transfer}
              </SingleLineEllipsis>
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
            <div className='flex items-center gap-2'>
              <div
                className={cn(
                  'text-sm font-medium whitespace-nowrap md:text-base',
                  transaction.isIncome ? 'text-green-600' : 'text-red-600'
                )}
              >
                {sign}
                {formatCurrency(transaction.amount, transaction.currency)}
              </div>
              <div className='flex items-center'>
                {transaction.isIncome ? (
                  <ArrowUpCircle className='h-4 w-4 text-green-500' />
                ) : (
                  <ArrowDownCircle className='h-4 w-4 text-red-500' />
                )}
              </div>
            </div>
          );
        },
        enableSorting: true
      },
      {
        accessorKey: 'category.name',
        header: 'Category',
        cell: ({ row }) => (
          <Badge
            variant='outline'
            className='bg-muted/30 max-w-[120px] truncate whitespace-nowrap md:max-w-[150px]'
          >
            <SingleLineEllipsis
              showTooltip
              className='max-w-[100px] truncate text-xs md:max-w-[130px]'
            >
              {row.original.category?.name ?? 'Uncategorized'}
            </SingleLineEllipsis>
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
            <div className='flex flex-col text-sm max-md:items-start'>
              <span className='font-medium whitespace-nowrap'>{format(date, 'MMM d, yyyy')}</span>
              <span className='text-muted-foreground text-xs'>{format(date, 'h:mm a')}</span>
            </div>
          );
        },
        enableSorting: true
      },
      {
        accessorKey: 'isIncome',
        header: 'Type',
        cell: ({ row }) => (
          <div className='flex items-center gap-1.5'>
            {row.original.isIncome ? (
              <ArrowUpCircle className='h-4 w-4 text-green-500' />
            ) : (
              <ArrowDownCircle className='h-4 w-4 text-red-500' />
            )}
            <span className='text-muted-foreground text-sm'>
              {row.original.isIncome ? 'Income' : 'Expense'}
            </span>
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
                  <div className='flex items-center gap-1'>
                    <Repeat className='h-4 w-4 text-blue-500' />
                    <span className='text-muted-foreground text-xs'>
                      {transaction.recurrenceType}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>{tooltipContent}</p>
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
          <SingleLineEllipsis
            showTooltip
            className='text-muted-foreground max-w-[80px] text-sm md:max-w-[120px]'
          >
            {row.original.createdBy?.name ?? 'N/A'}
          </SingleLineEllipsis>
        ),
        enableSorting: false
      },
      {
        id: 'actions',
        header: () => 'Actions',
        headerAlign: 'right',
        cell: ({ row }) => (
          <div className='flex justify-end gap-2'>
            <Button
              size='icon'
              variant='ghost'
              onClick={() => handleEditClick(row.original)}
              className='hover:bg-muted h-8 w-8'
            >
              <Pencil className='text-muted-foreground h-3.5 w-3.5' />
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
                  className='text-destructive hover:bg-destructive/10 h-8 w-8'
                  onClick={() => handleDeleteClick(row.original.id)}
                >
                  <Trash2 className='h-3.5 w-3.5' />
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
        tableClassName='bg-white'
        cellClassName='px-4 py-3'
        headerClassName='bg-gray-50'
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
