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
  mobilePrimaryColumns?: string[];
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
  const [columnVisibility, setColumnVisibility] = useState({});

  const { columnSizing, setColumnSizing } = useTableColumnResize(tableId);

  useEffect(() => {
    const propSorting: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [];
    setInternalSorting(propSorting);
  }, [sortBy, sortOrder]);

  const handleSortingChange = (updater: any) => {
    const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
    setInternalSorting(newSorting);
    if (onSortChange) {
      onSortChange(newSorting);
    }
  };

  const handlePaginationChange = (updater: any) => {
    const newPagination =
      typeof updater === 'function' ? updater(table.getState().pagination) : updater;
    onPageChange(newPagination.pageIndex + 1);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: internalSorting,
      columnVisibility,
      columnSizing,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: pageSize
      }
    },
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalRecords / pageSize),
    columnResizeMode: 'onChange'
  });

  if (loading && (!data || data.length === 0)) {
    return (
      <div className='w-full'>
        <div className='flex h-64 w-full items-center justify-center'>
          <Loader />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className='text-muted-foreground flex h-full min-h-[200px] w-full items-center justify-center'>
        <NoData message='No results found.' />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn('bg-card w-full overflow-x-auto rounded-lg border shadow-sm', tableClassName)}
      >
        <Table className={cn('min-w-full')} style={{ width: table.getTotalSize() }}>
          <TableHeader className={cn('bg-muted', headerClassName)}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'group/th text-muted-foreground relative px-3 py-2 text-left text-xs font-medium tracking-wider uppercase',
                      { 'whitespace-nowrap': !isMobile },
                      headerClassName,
                      header.index < headerGroup.headers.length - 1 && 'border-r' // Add border-r to all but the last header
                    )}
                    style={{
                      width: header.getSize(),
                      minWidth: isMobile ? 'auto' : header.getSize()
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
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`loading-${i}`} className={cn(i < pageSize - 1 && 'border-b')}>
                  {columns.map((_col, j) => (
                    <TableCell
                      key={`skeleton-${i}-${j}`}
                      className={cn('p-3', j < columns.length - 1 && 'border-r')}
                    >
                      <Skeleton className='h-5 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'hover:bg-muted/50 transition-colors',
                    rowIndex < table.getRowModel().rows.length - 1 && 'border-b' // Add border-b to all but the last row
                  )}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'truncate p-3 align-middle text-sm',
                        cellClassName,
                        cellIndex < row.getVisibleCells().length - 1 && 'border-r' // Add border-r to all but the last cell
                      )}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && totalRecords > pageSize && (
        <div className='mt-4'>
          <EnhancedPagination
            totalRecords={totalRecords}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={onPageChange}
            isMobile={isMobile}
          />
        </div>
      )}
    </>
  );
};

export default CommonTable;
