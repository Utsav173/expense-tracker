'use client';

import React, { useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import Loader from './loader';
import EnhancedPagination from './enhance-pagination';
import { DataTableResizer } from './data-table-resizer';
import { useTableColumnResize } from '@/hooks/use-table-column-resize';
import NoData from './no-data';
import { Skeleton } from './skeleton';

interface CommonTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
  totalRecords: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSortChange?: (sorting: SortingState) => void;
  enablePagination?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tableClassName?: string;
  headerClassName?: string;
  cellClassName?: string;
  tableId: string;
}

const CommonTable = <T extends object>({
  data,
  columns,
  loading,
  totalRecords,
  pageSize,
  currentPage,
  onPageChange,
  onSortChange,
  enablePagination = true,
  sortBy,
  sortOrder,
  tableClassName,
  headerClassName,
  cellClassName,
  tableId
}: CommonTableProps<T>) => {
  const isMobile = useIsMobile();
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const { columnSizing, setColumnSizing } = useTableColumnResize(tableId);

  useEffect(() => {
    const propSorting: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [];
    setInternalSorting(propSorting);
  }, [sortBy, sortOrder]);

  const handleSortingChange = (updater: any) => {
    const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
    setInternalSorting(newSorting);
    onSortChange?.(newSorting);
  };

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      sorting: internalSorting,
      columnSizing,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: pageSize
      }
    },
    onSortingChange: handleSortingChange,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil((totalRecords ?? 0) / pageSize),
    columnResizeMode: 'onChange'
  });

  if (loading && (!data || data.length === 0)) {
    return (
      <div className='flex h-80 w-full items-center justify-center rounded-lg border'>
        <Loader />
      </div>
    );
  }

  if (!loading && (!data || data.length === 0)) {
    return (
      <NoData
        message='No results were found.'
        description='Try adjusting your filters or search terms.'
      />
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className={cn('overflow-auto rounded-lg border shadow-sm', tableClassName)}>
        <Table className='min-w-full' style={{ width: table.getTotalSize() }}>
          <TableHeader className='bg-muted/20 sticky top-0 z-10 backdrop-blur-sm'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn('relative h-12 px-4', headerClassName)}
                    style={{
                      width: header.getSize()
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanResize() && !isMobile && (
                      <DataTableResizer header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={`loading-${i}`} className='hover:bg-transparent'>
                    {columns.map((_col, j) => (
                      <TableCell key={`skeleton-${i}-${j}`} className='p-2'>
                        <Skeleton className='h-6 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn('p-2', cellClassName)}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {enablePagination && totalRecords > pageSize && (
        <EnhancedPagination
          totalRecords={totalRecords}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={onPageChange}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default CommonTable;