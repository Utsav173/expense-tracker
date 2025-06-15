'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getPaginationRowModel,
  SortingState,
  HeaderContext,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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

  const sortOptions = useMemo(() => {
    return table
      .getAllLeafColumns()
      .filter((column) => column.getCanSort() && column.id !== 'actions')
      .flatMap((column) => {
        const headerLabel = (column.columnDef.meta as { header?: string })?.header || column.id;
        return [
          {
            id: `${column.id}-asc`,
            label: `Sort by ${headerLabel} (Asc)`,
            value: `${column.id}-asc`
          },
          {
            id: `${column.id}-desc`,
            label: `Sort by ${headerLabel} (Desc)`,
            value: `${column.id}-desc`
          }
        ];
      });
  }, [table]);

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
      {/* Mobile Sort Dropdown */}
      <div className='mb-3 flex justify-end'>
        {isMobile && onSortChange && sortOptions.length > 0 && (
          <Select
            value={
              internalSorting.length
                ? `${internalSorting[0].id}-${internalSorting[0].desc ? 'desc' : 'asc'}`
                : 'none'
            }
            onValueChange={(value) => {
              if (value === 'none') {
                handleSortingChange([]);
              } else if (value) {
                const [id, order] = value.split('-');
                handleSortingChange([{ id, desc: order === 'desc' }]);
              }
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Sort by...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>Default Order</SelectItem>
              {sortOptions.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className='w-full overflow-x-auto rounded-lg border'>
        <Table className={cn('min-w-full', tableClassName)} style={{ width: table.getTotalSize() }}>
          <TableHeader className={headerClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'group/th text-muted-foreground relative px-3 py-2 text-left text-xs font-medium tracking-wider uppercase',
                      { 'whitespace-nowrap': !isMobile },
                      headerClassName
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
                <TableRow key={`loading-${i}`}>
                  {columns.map((_col, j) => (
                    <TableCell key={`skeleton-${i}-${j}`} className='p-3'>
                      <Skeleton className='h-5 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='hover:bg-muted/50 transition-colors'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn('truncate p-3 align-middle text-sm', cellClassName)}
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
