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
  HeaderContext
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';

const Loader = () => <div>Loading...</div>;

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
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (sortBy && sortOrder) {
      return [{ id: sortBy, desc: sortOrder === 'desc' }];
    }
    return [];
  });

  const [sortOptions, setSortOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    if (sortBy && sortOrder && onSortChange) {
      onSortChange([{ id: sortBy, desc: sortOrder === 'desc' }]);
    }
  }, [sortBy, sortOrder, onSortChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalRecords / pageSize)
  });

  useEffect(() => {
    const generatedOptions = table
      .getAllLeafColumns()
      .filter((column) => column.getCanSort())
      .flatMap((column) => [
        {
          id: `${column.id}-asc`,
          label: `Sort by ${column.columnDef.header?.toString() || column.id} (Asc)`
        },
        {
          id: `${column.id}-desc`,
          label: `Sort by ${column.columnDef.header?.toString() || column.id} (Desc)`
        }
      ]);
    setSortOptions(generatedOptions);
  }, [table]);

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
        {/* Sorting Dropdown for Mobile */}
        <div className='mb-4'>
          <Select
            onValueChange={(value) => {
              const [id, desc] = value.split('-');
              setSorting([{ id, desc: desc === 'desc' }]);
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Accordion for Mobile */}
        <Accordion type='single' collapsible className='w-full'>
          {table.getRowModel().rows.map((row) => (
            <AccordionItem key={row.id} value={row.id}>
              <AccordionTrigger className='px-4 py-2 text-left'>
                <div className='flex w-full justify-between'>
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.getCanSort())
                    .slice(0, 2)
                    .map((column) => (
                      <span key={column.id} className='max-w-[50%] truncate'>
                        {flexRender(column.columnDef.cell, { row, column } as CellContext<T, any>)}
                      </span>
                    ))}
                </div>
              </AccordionTrigger>

              <AccordionContent className='px-4 py-2'>
                {table.getAllLeafColumns().map((column) => {
                  const header = column.columnDef.header;
                  const cellValue = flexRender(column.columnDef.cell, {
                    row,
                    column
                  } as CellContext<T, any>);
                  const headerString =
                    typeof header === 'function'
                      ? flexRender(header, { column } as HeaderContext<T, unknown>)
                      : header;
                  return (
                    <div key={column.id} className='grid grid-cols-2 gap-2'>
                      <span className='font-medium'>{headerString}:</span>
                      <span>{cellValue}</span>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

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
  }

  return (
    <>
      <div className='w-full overflow-x-auto rounded-md border'>
        <Table className='min-w-[640px] lg:min-w-full'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className='cursor-pointer px-4 py-3 hover:bg-gray-100'
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                    <span className='ml-2'>
                      {{
                        asc: <ChevronUp className='h-4 w-4' />,
                        desc: <ChevronDown className='h-4 w-4' />
                      }[header.column.getIsSorted() as string] ?? (
                        <ChevronsUpDown className='h-4 w-4' />
                      )}
                    </span>
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

      {/* Pagination */}
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
