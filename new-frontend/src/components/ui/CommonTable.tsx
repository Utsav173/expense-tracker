'use client';

import React, { useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  CellContext,
  HeaderContext,
  ColumnSort
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Loader from './loader';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

interface CommonTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
  totalRecords: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSortChange?: (sorting: SortingState) => void;
  enablePagination: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const columnHelper = createColumnHelper<any>();

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
  sortOrder
}: CommonTableProps<T>) => {
  const isMobile = useIsMobile();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>(() => {
    // Initialize sorting based on sortBy and sortOrder
    if (sortBy && sortOrder) {
      return [{ id: sortBy, desc: sortOrder === 'desc' }];
    }
    return [];
  });

  useEffect(() => {
    if (sortBy && sortOrder && onSortChange) {
      onSortChange([{ id: sortBy, desc: sortOrder === 'desc' }]);
    }
  }, [sortBy, sortOrder, onSortChange]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const mobileColumns: ColumnDef<T, any>[] = [
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
    }),
    ...columns.map((column) => ({
      ...column,
      cell: (info: CellContext<T, any>) => {
        const dataItem: T = info.row.original;
        const columnId = column.id as keyof T; // Properly type the column id
        return (
          <div className='max-w-[150px] truncate font-medium'>
            {typeof column.cell === 'function'
              ? column.cell(info)
              : columnId
                ? dataItem[columnId]
                : null}
          </div>
        );
      }
    }))
  ];

  const table = useReactTable({
    data,
    columns: isMobile ? mobileColumns : columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting: sorting
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalRecords / pageSize)
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center'>
        <Loader />
      </div>
    );
  }

  if (!data.length) {
    return <div className='py-8 text-center text-gray-500'>No results.</div>;
  }

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
                          {/* Custom rendering for expanded content */}
                          {row.getVisibleCells().map((cell) => {
                            const header = cell.column.columnDef.header;
                            const cellValue = flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            );
                            if (
                              cell.column.id !== 'expand' &&
                              header &&
                              cell.column.columnDef.id !== 'actions'
                            ) {
                              const headerString =
                                typeof header === 'function'
                                  ? flexRender(header, {
                                      ...cell.getContext(),
                                      header: cell.column.columnDef
                                    } as unknown as HeaderContext<T, unknown>)
                                  : header;
                              return (
                                <div key={cell.id} className='grid grid-cols-2 gap-2'>
                                  <span className='font-medium'>{headerString} :</span>
                                  <span>{cellValue}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                          {/* Pass row.original for rendering custom actions */}
                          {columns.some((col) => col.id === 'actions') && (
                            <div className='flex gap-2 pt-2'>
                              {flexRender(
                                (columns.find((col) => col.id === 'actions') as ColumnDef<T, any>)
                                  .cell,
                                { row: row, column: {} } as CellContext<T, any>
                              )}
                            </div>
                          )}
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
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
      {enablePagination && totalRecords > pageSize && (
        <Pagination className='mt-6'>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious href='#' onClick={() => onPageChange(currentPage - 1)} />
              </PaginationItem>
            )}

            {Array.from({ length: Math.ceil(totalRecords / pageSize) }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p <= 2 ||
                  p >= Math.ceil(totalRecords / pageSize) - 1 ||
                  Math.abs(p - currentPage) <= 1
              )
              .map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href='#'
                    isActive={p === currentPage}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

            {currentPage < Math.ceil(totalRecords / pageSize) && (
              <PaginationItem>
                <PaginationNext href='#' onClick={() => onPageChange(currentPage + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};

export default CommonTable;
