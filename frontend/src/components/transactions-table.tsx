'use client';

import React, { useMemo, useState } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import UpdateTransactionModal from './modals/update-transaction-modal';
import DeleteConfirmationModal from './modals/delete-confirmation-modal';
import { transactionDelete } from '@/lib/endpoints/transactions';
import { useToast } from '@/lib/hooks/useToast';
import { Transaction as TransactionType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import CommonTable from './ui/CommonTable';

interface TransactionTableProps {
  transactions: TransactionType[] | undefined;
  onUpdate: () => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  totalRecords: number;
  page: number;
  handlePageChange: (page: number) => void;
}

const TransactionTable = ({
  transactions,
  onUpdate,
  onSort,
  sortBy,
  sortOrder,
  loading,
  totalRecords,
  page,
  handlePageChange
}: TransactionTableProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await transactionDelete(id);
      showSuccess('Transaction deleted successfully!');
      onUpdate();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const columns = useMemo<ColumnDef<TransactionType>[]>(
    () => [
      {
        accessorKey: 'text',
        header: 'Text',
        cell: (info) => <div className='max-w-[200px] truncate'>{info.row.original.text}</div>,
        sortingFn: 'alphanumeric'
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: (info) => {
          const transaction = info.row.original;
          return (
            <div className='min-w-[80px]'>
              {formatCurrency(transaction.amount, transaction.currency)}
            </div>
          );
        }
      },
      {
        accessorKey: 'category.name',
        header: 'Category',
        cell: (info) => (
          <div className='max-w-[150px] truncate'>{info.row.original.category?.name ?? 'N/A'}</div>
        )
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: (info) => format(new Date(info.row.original.createdAt), 'yyyy-MM-dd HH:mm:ss')
      },
      {
        accessorKey: 'isIncome',
        header: 'Type',
        cell: (info) => (info.row.original.isIncome ? 'Income' : 'Expense')
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex gap-2 whitespace-nowrap'>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => {
                setSelectedTransaction(row.original);
                setIsUpdateModalOpen(true);
              }}
            >
              <Pencil size={18} />
            </Button>
            <DeleteConfirmationModal
              title='Delete Transaction'
              description='Are you sure you want to delete this transaction?'
              onConfirm={() => handleDelete(row.original.id)}
              triggerButton={
                <Button size='sm' variant='ghost'>
                  <Trash2 size={18} />
                </Button>
              }
            />
          </div>
        )
      }
    ],
    []
  );

  const handleSortChange = (sorting: SortingState) => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      onSort(sort.id, sort.desc ? 'desc' : 'asc');
    }
  };

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
      />
      <UpdateTransactionModal
        isOpen={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        transaction={selectedTransaction}
        onUpdate={onUpdate}
      />
    </>
  );
};

export default TransactionTable;
