'use client';

import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import UpdateTransactionModal from './modals/update-transaction-modal';
import DeleteConfirmationModal from './modals/delete-confirmation-modal';
import { transactionDelete } from '@/lib/endpoints/transactions';
import { useToast } from '@/lib/hooks/useToast';
import { Transaction as TransactionType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const { showSuccess, showError } = useToast();
  const isMobile = useIsMobile();

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const columns: ColumnDef<TransactionType, any>[] = [
    columnHelper.accessor('text', {
      header: () => (
        <div className='min-w-[120px] cursor-pointer' onClick={() => onSort('text')}>
          Text {sortBy === 'text' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      ),
      cell: (info) => <div className='max-w-[200px] truncate'>{info.getValue()}</div>
    }),
    columnHelper.accessor('amount', {
      header: () => (
        <div className='min-w-[100px] cursor-pointer' onClick={() => onSort('amount')}>
          Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      ),
      cell: (info) => {
        const transaction = info.row.original;
        return (
          <div className='min-w-[80px]'>
            {formatCurrency(info.getValue(), transaction.currency)}
          </div>
        );
      }
    }),
    columnHelper.accessor('category.name', {
      header: () => (
        <div className='min-w-[100px] cursor-pointer' onClick={() => onSort('category.name')}>
          Category {sortBy === 'category.name' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      ),
      cell: (info) => <div className='max-w-[150px] truncate'>{info.getValue() ?? 'N/A'}</div>
    }),
    columnHelper.accessor('createdAt', {
      header: () => (
        <div className='min-w-[140px] cursor-pointer' onClick={() => onSort('createdAt')}>
          Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      ),
      cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm:ss')
    }),
    columnHelper.accessor('isIncome', {
      header: () => <div className='min-w-[80px]'>Type</div>,
      cell: (info) => (info.getValue() ? 'Income' : 'Expense')
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className='min-w-[80px]'>Actions</div>,
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
    })
  ];

  const mobileColumns: ColumnDef<TransactionType, any>[] = [
    columnHelper.accessor('text', {
      header: () => (
        <div className='cursor-pointer' onClick={() => onSort('text')}>
          Transaction {sortBy === 'text' && (sortOrder === 'asc' ? '▲' : '▼')}
        </div>
      ),
      cell: (info) => <div className='max-w-[150px] truncate font-medium'>{info.getValue()}</div>
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => {
        const transaction = info.row.original;
        return formatCurrency(info.getValue(), transaction.currency);
      }
    }),
    columnHelper.display({
      id: 'expand',
      cell: ({ row }) => (
        <Button
          size='sm'
          variant='ghost'
          onClick={() => toggleRowExpansion(row.id)}
          className='ml-auto'
        >
          {expandedRows[row.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Button>
      )
    })
  ];

  const table = useReactTable({
    data: transactions ?? [],
    columns: isMobile ? mobileColumns : columns,
    getCoreRowModel: getCoreRowModel()
  });

  const handleDelete = async (id: string) => {
    try {
      await transactionDelete(id);
      showSuccess('Transaction deleted successfully!');
      onUpdate();
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (isMobile) {
    return (
      <>
        <div className='w-full rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className='px-2 py-3'>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow className='cursor-pointer' onClick={() => toggleRowExpansion(row.id)}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className='px-2 py-3'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandedRows[row.id] && (
                      <TableRow>
                        <TableCell colSpan={mobileColumns.length} className='bg-muted/30 p-4'>
                          <div className='space-y-3 text-sm'>
                            <div className='grid grid-cols-2 gap-2'>
                              <span className='font-medium'>Category:</span>
                              <span>{row.original.category?.name ?? 'N/A'}</span>
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                              <span className='font-medium'>Date:</span>
                              <span>
                                {format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                              </span>
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                              <span className='font-medium'>Type:</span>
                              <span>{row.original.isIncome ? 'Income' : 'Expense'}</span>
                            </div>
                            <div className='flex gap-2 pt-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                className='w-full'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTransaction(row.original);
                                  setIsUpdateModalOpen(true);
                                }}
                              >
                                <Pencil size={16} className='mr-1' /> Edit
                              </Button>
                              <DeleteConfirmationModal
                                title='Delete Transaction'
                                description='Are you sure you want to delete this transaction?'
                                onConfirm={() => handleDelete(row.original.id)}
                                triggerButton={
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='w-full'
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 size={16} className='mr-1' /> Delete
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={mobileColumns.length} className='h-24 text-center'>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <UpdateTransactionModal
          isOpen={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
          transaction={selectedTransaction}
          onUpdate={onUpdate}
        />
      </>
    );
  }

  return (
    <>
      <div className='w-full overflow-x-auto rounded-md border'>
        <Table className='min-w-[640px] lg:min-w-full'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className='px-4 py-3'>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='px-4 py-3'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
