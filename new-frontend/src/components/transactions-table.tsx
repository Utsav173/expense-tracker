// src/app/components/TransactionTable.tsx
'use client';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useEffect, useState } from 'react';
import { Transaction as TransactionType } from '@/lib/types';

interface TransactionProps {
  transactions: TransactionType[] | undefined;
}

const columnHelper = createColumnHelper<TransactionType>();

const TransactionTable = ({ transactions }: TransactionProps) => {
  const [data, setData] = useState<TransactionType[]>([]);

  useEffect(() => {
    if (transactions) {
      setData(transactions);
    }
  }, [transactions]);

  const columns = [
    columnHelper.accessor('text', {
      header: 'Text',
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
    }),
    columnHelper.accessor('category.name', {
      header: 'Category',
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor('isIncome', {
      header: 'Type',
      cell: (info) => (info.getValue() ? 'Income' : 'Expense'),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              );
            })}
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
  );
};

export default TransactionTable;
