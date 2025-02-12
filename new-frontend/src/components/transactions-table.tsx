'use client';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import UpdateTransactionModal from './modals/update-transaction-modal';
import React, { useState } from 'react';
import DeleteConfirmationModal from './modals/delete-confirmation-modal';
import { transactionDelete } from '@/lib/endpoints/transactions';
import { useToast } from '@/lib/hooks/useToast';
import { Transaction as TransactionType } from '@/lib/types'; // Import TransactionType

interface TransactionTableProps {
  transactions: TransactionType[] | undefined;
  onUpdate: () => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const columnHelper = createColumnHelper<TransactionType>();

const TransactionTable = ({
  transactions,
  onUpdate,
  onSort,
  sortBy,
  sortOrder
}: TransactionTableProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  const columns: ColumnDef<TransactionType, any>[] = [
    columnHelper.accessor('text', {
      header: () => (
        <div
          className='cursor-pointer'
          onClick={() => {
            onSort('text');
          }}
        >
          Text {sortBy === 'text' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      )
    }),
    columnHelper.accessor('amount', {
      header: () => (
        <div
          className='cursor-pointer'
          onClick={() => {
            onSort('amount');
          }}
        >
          Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      ),
      cell: (info) => info.getValue().toFixed(2)
    }),
    columnHelper.accessor('category.name', {
      header: () => (
        <div
          className='cursor-pointer'
          onClick={() => {
            onSort('category.name');
          }}
        >
          Category {sortBy === 'category.name' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      ),
      cell: (info) => info.getValue() ?? 'N/A'
    }),
    columnHelper.accessor('createdAt', {
      header: () => (
        <div
          className='cursor-pointer'
          onClick={() => {
            onSort('createdAt');
          }}
        >
          Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      ),
      cell: (info) => new Date(info.getValue()).toLocaleDateString()
    }),
    columnHelper.accessor('isIncome', {
      header: 'Type',
      cell: (info) => (info.getValue() ? 'Income' : 'Expense')
    }),
    columnHelper.display({
      id: 'actions',
      cell: ({ row }) => (
        <div>
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
    })
  ];

  const table = useReactTable({
    data: transactions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const handleDelete = async (id: string) => {
    try {
      await transactionDelete(id);
      showSuccess('Transaction deleted successfully!');
      onUpdate(); // Refetch transactions
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
