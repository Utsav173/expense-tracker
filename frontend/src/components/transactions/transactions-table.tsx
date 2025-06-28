'use client';

import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Repeat, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import UpdateTransactionModal from '../modals/update-transaction-modal';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { transactionDelete } from '@/lib/endpoints/transactions';
import { useToast } from '@/lib/hooks/useToast';
import { Transaction as TransactionType } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import CommonTable from '../ui/CommonTable';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SingleLineEllipsis } from '../ui/ellipsis-components';
import { DataTableColumnHeader } from '../ui/column-header';

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
  isOwner?: boolean;
  tableId: string; // Required for state persistence
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
  refetchData,
  isOwner = true,
  tableId
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

  const handleDelete = React.useCallback(async () => {
    if (deleteTransactionId) {
      await deleteMutation.mutateAsync(deleteTransactionId);
    }
  }, [deleteTransactionId, deleteMutation]);

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
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
        meta: { header: 'Description' },
        cell: ({ row }) => (
          <div className='flex flex-col space-y-1'>
            <SingleLineEllipsis
              showTooltip
              className='max-w-[200px] text-sm font-medium md:max-w-[250px]'
            >
              {row.original.text}
            </SingleLineEllipsis>
            {row.original.transfer && (
              <SingleLineEllipsis
                showTooltip
                className='text-muted-foreground max-w-[200px] text-xs md:max-w-[250px]'
              >
                via {row.original.transfer}
              </SingleLineEllipsis>
            )}
          </div>
        )
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
        meta: { header: 'Amount' },
        cell: ({ row }) => {
          const transaction = row.original;
          const sign = transaction.isIncome ? '+' : '-';
          return (
            <div
              className={cn(
                'font-semibold whitespace-nowrap',
                transaction.isIncome ? 'text-success' : 'text-destructive'
              )}
            >
              {sign}
              {formatCurrency(transaction.amount, transaction.currency)}
            </div>
          );
        }
      },
      {
        accessorKey: 'category.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
        meta: { header: 'Category' },
        cell: ({ row }) => (
          <Badge variant='outline' className='bg-muted/30 max-w-[120px] truncate md:max-w-[150px]'>
            {row.original.category?.name ?? 'Uncategorized'}
          </Badge>
        )
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        meta: { header: 'Date' },
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className='flex flex-col text-sm'>
              <span className='font-medium whitespace-nowrap'>{format(date, 'MMM d, yyyy')}</span>
              <span className='text-muted-foreground text-xs'>{format(date, 'h:mm a')}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'isIncome',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
        meta: { header: 'Type' },
        cell: ({ row }) => (
          <div className='flex items-center gap-1.5'>
            {row.original.isIncome ? (
              <ArrowUpCircle className='text-success h-4 w-4' />
            ) : (
              <ArrowDownCircle className='text-destructive h-4 w-4' />
            )}
            <span className='text-muted-foreground text-sm'>
              {row.original.isIncome ? 'Income' : 'Expense'}
            </span>
          </div>
        )
      },
      ...(isOwner
        ? [
            {
              id: 'actions' as const,
              header: 'Actions',
              cell: ({ row }: { row: any }) => (
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
                            row.original.isIncome ? 'text-success' : 'text-destructive',
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
          ]
        : [])
    ],
    [isOwner, deleteTransactionId, handleDelete]
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
        onSortChange={(sorting) => {
          if (sorting.length > 0) {
            onSort(sorting[0].id, sorting[0].desc ? 'desc' : 'asc');
          } else {
            onSort('', 'asc');
          }
        }}
        enablePagination
        sortBy={sortBy}
        sortOrder={sortOrder}
        tableClassName='bg-background'
        headerClassName='bg-muted'
        cellClassName='border-border'
        tableId={tableId} // Pass the required tableId
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
