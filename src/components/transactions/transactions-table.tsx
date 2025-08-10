'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Repeat, ArrowUpCircle, ArrowDownCircle, Eye } from 'lucide-react';
import UpdateTransactionModal from '../modals/update-transaction-modal';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { transactionDelete } from '@/lib/endpoints/transactions';
import { useToast } from '@/lib/hooks/useToast';
import type { TransactionAPI, AccountAPI } from '@/lib/api/api-types';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import CommonTable from '../ui/CommonTable';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SingleLineEllipsis } from '../ui/ellipsis-components';
import { DataTableColumnHeader } from '../ui/column-header';
import RecurringInsightModal from '../modals/recurring-insight-modal';
import { useAuth } from '@/components/providers/auth-provider';
import { useConvertedCurrency } from '@/hooks/use-converted-currency';

// Helper Component for Currency Conversion Tooltip
const ConvertedAmountTooltip = ({
  transaction,
  children
}: {
  transaction: TransactionAPI.Transaction;
  children: React.ReactNode;
}) => {
  const { session } = useAuth();
  const preferredCurrency = session?.user?.preferredCurrency || 'INR';

  const needsConversion = transaction.currency.toUpperCase() !== preferredCurrency.toUpperCase();

  const { data: converted, isLoading } = useConvertedCurrency(
    transaction.amount,
    transaction.currency
  );

  if (!needsConversion) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{transaction.amount}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        {isLoading ? (
          <p>Converting...</p>
        ) : converted ? (
          <p>Approx. {formatCurrency(converted.convertedAmount, preferredCurrency)}</p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
};

interface TransactionTableProps {
  transactions: TransactionAPI.Transaction[] | undefined;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  totalRecords: number;
  page: number;
  handlePageChange: (page: number) => void;
  refetchData: () => Promise<void>;
  isOwner?: boolean;
  tableId: string;
  accountsData?: AccountAPI.SimpleAccount[];
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
  tableId,
  accountsData
}: TransactionTableProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionAPI.Transaction | null>(
    null
  );
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [insightTransactionId, setInsightTransactionId] = useState<string | null>(null);
  const { showError } = useToast();

  const deleteMutation = useMutation({
    mutationFn: transactionDelete,
    onSuccess: async () => {
      await refetchData();
      setDeleteTransactionId(null);
    },
    onError: (error: any) => {
      showError(error.message);
      setDeleteTransactionId(null);
    }
  });

  const handleDelete = useCallback(async () => {
    if (deleteTransactionId) {
      await deleteMutation.mutateAsync(deleteTransactionId);
    }
  }, [deleteTransactionId, deleteMutation]);

  const handleEditClick = (transaction: TransactionAPI.Transaction) => {
    setSelectedTransaction(transaction);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTransactionId(id);
  };

  const handleInsightClick = useCallback((transactionId: string) => {
    setInsightTransactionId(transactionId);
  }, []);

  const columns = useMemo<ColumnDef<TransactionAPI.Transaction>[]>(
    () => [
      {
        accessorKey: 'text',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
        meta: { header: 'Description' },
        cell: ({ row }) => (
          <div className='flex flex-col'>
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
            <ConvertedAmountTooltip transaction={transaction}>
              <div
                className={cn(
                  'font-mono font-semibold whitespace-nowrap tabular-nums',
                  transaction.isIncome ? 'text-success' : 'text-destructive'
                )}
              >
                {sign}
                {formatCurrency(transaction.amount, transaction.currency)}
              </div>
            </ConvertedAmountTooltip>
          );
        }
      },
      {
        accessorKey: 'category.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
        meta: { header: 'Category' },
        cell: ({ row }) => (
          <Badge variant='secondary' className='max-w-[120px] truncate md:max-w-[150px]'>
            <SingleLineEllipsis>
              {row.original.category?.name ?? 'Uncategorized'}
            </SingleLineEllipsis>
          </Badge>
        )
      },
      ...(accountsData?.length
        ? [
            {
              accessorKey: 'account',
              header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title='Account' />
              ),
              meta: { header: 'Account' },
              cell: ({ row }: { row: Row<TransactionAPI.Transaction> }) => {
                const account = accountsData?.find((acc) => acc.id === row.original.account);
                return (
                  <SingleLineEllipsis
                    showTooltip
                    className='max-w-[120px] text-sm md:max-w-[150px]'
                  >
                    {account?.name ?? 'N/A'}
                  </SingleLineEllipsis>
                );
              }
            }
          ]
        : []),
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        meta: { header: 'Date' },
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className='flex flex-col items-start gap-1 text-sm'>
              <span className='font-medium whitespace-nowrap'>{format(date, 'MMM d, yyyy')}</span>
              <span className='text-muted-foreground text-xs'>{format(date, 'h:mm a')}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
        meta: { header: 'Type' },
        cell: ({ row }) => (
          <div className='flex flex-col items-start gap-1.5'>
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
            {row.original.recurring && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant='secondary' className='flex items-center gap-1 text-xs'>
                    <Repeat className='h-3 w-3' />
                    {row.original.recurrenceType
                      ? row.original.recurrenceType.charAt(0).toUpperCase() +
                        row.original.recurrenceType.slice(1)
                      : 'Recurring'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a recurring transaction template.</p>
                </TooltipContent>
              </Tooltip>
            )}
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
                  {row.original.recurring && (
                    <Button
                      size='icon'
                      variant='ghost'
                      onClick={() => handleInsightClick(row.original.id)}
                      className='h-8 w-8'
                    >
                      <Eye className='text-muted-foreground h-3.5 w-3.5' />
                      <span className='sr-only'>View Recurring Details</span>
                    </Button>
                  )}
                  <Button
                    size='icon'
                    variant='ghost'
                    onClick={() => handleEditClick(row.original)}
                    className='h-8 w-8'
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
    [accountsData, isOwner, handleDelete, deleteTransactionId, handleInsightClick]
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
        tableId={tableId}
      />
      <RecurringInsightModal
        isOpen={!!insightTransactionId}
        onOpenChange={(isOpen) => !isOpen && setInsightTransactionId(null)}
        transactionId={insightTransactionId}
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
