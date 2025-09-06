'use client';

import React, { useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  RowSelectionState,
  useReactTable
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface ImportPreviewTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
}

export function ImportPreviewTable<TData>({
  data,
  columns,
  rowSelection,
  setRowSelection
}: ImportPreviewTableProps<TData>) {
  const memoizedColumns = useMemo<ColumnDef<TData>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className='flex items-center justify-center'>
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label='Select all'
              className='translate-y-[2px]'
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label='Select row'
              className='translate-y-[2px]'
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false
      },
      ...columns
    ],
    [columns]
  );

  const table = useReactTable({
    data,
    columns: memoizedColumns,
    state: {
      rowSelection
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true
  });

  return (
    <div className='max-h-[65dvh] overflow-auto rounded-lg border shadow-md'>
      <Table>
        <TableHeader className='bg-muted/80 sticky top-0 z-10 backdrop-blur-sm'>
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className='p-3 text-sm'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={memoizedColumns.length} className='h-48 text-center'>
                <div className='flex flex-col items-center justify-center space-y-4'>
                  <div className='text-muted-foreground text-lg font-medium'>
                    No data to display.
                  </div>
                  <div className='text-muted-foreground/80 text-sm'>
                    Upload a file to get started.
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
