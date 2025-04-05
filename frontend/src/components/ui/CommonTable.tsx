'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getPaginationRowModel,
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
import { cn } from '@/lib/utils';
import Loader from './loader';
import EnhancedPagination from './enhance-pagination';

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
  mobileTriggerColumns?: string[];
  paginationVariant?: 'default' | 'minimalist' | 'pill';
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
  mobileTriggerColumns,
  paginationVariant = 'default'
}: CommonTableProps<T>) => {
  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (sortBy && sortOrder) {
      return [{ id: sortBy, desc: sortOrder === 'desc' }];
    }
    return [];
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalRecords / pageSize)
  });

  useEffect(() => {
    if (onSortChange) {
      const propSorting: SortingState =
        sortBy && sortOrder ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [];

      const isDifferent =
        sorting.length !== propSorting.length ||
        (sorting.length > 0 &&
          (sorting[0].id !== propSorting[0]?.id || sorting[0].desc !== propSorting[0]?.desc));

      if (isDifferent) {
        onSortChange(sorting);
      }
    }
  }, [sorting, onSortChange, sortBy, sortOrder]);

  const sortOptions = useMemo(() => {
    return table
      .getAllLeafColumns()
      .filter((column) => column.getCanSort() && column.id !== 'actions')
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
  }, [table]);

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className='py-8 text-center text-gray-500'>No results.</div>;
  }

  // Mobile View Logic
  if (isMobile && columns.length > 2) {
    const triggerColumns = mobileTriggerColumns
      ? table.getAllLeafColumns().filter((col) => mobileTriggerColumns.includes(col.id))
      : table
          .getAllLeafColumns()
          .filter((column) => column.getCanSort() && column.id !== 'actions')
          .slice(0, 2);

    return (
      <>
        {/* Sort Select Dropdown for Mobile */}
        <Select
          value={sorting.length ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : 'none'}
          onValueChange={(value) => {
            if (value === 'none') {
              setSorting([]);
            } else if (value) {
              const [id, desc] = value.split('-');
              setSorting([{ id, desc: desc === 'desc' }]);
            }
          }}
        >
          <SelectTrigger className='mb-4 w-full'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>No Sorting</SelectItem>
            {sortOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mobile Accordion View */}
        <Accordion type='multiple' className='w-full'>
          {table.getRowModel().rows.map((row) => (
            <AccordionItem key={row.id} value={row.id}>
              <AccordionTrigger className='hover:no-underline'>
                <div className='flex w-full items-center justify-between text-left'>
                  {triggerColumns.map((column) => (
                    <span key={column.id} className='max-w-[50%] truncate px-1 text-sm'>
                      {column.columnDef.cell
                        ? flexRender(
                            column.columnDef.cell,
                            row
                              .getVisibleCells()
                              .find((c) => c.column.id === column.id)!
                              .getContext()
                          )
                        : row.getValue(column.id)}
                    </span>
                  ))}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className='grid w-full grid-cols-[35%_65%] gap-y-2'>
                  {table.getAllLeafColumns().map((column) => {
                    const header = column.columnDef.header;
                    const cell = row.getVisibleCells().find((c) => c.column.id === column.id);

                    const cellValue = cell
                      ? flexRender(cell.column.columnDef.cell, cell.getContext())
                      : row.getValue(column.id);

                    const headerString =
                      typeof header === 'function'
                        ? flexRender(header, cell?.getContext() as any)
                        : header?.toString() || column.id;

                    const displayValue =
                      cellValue === null || cellValue === undefined
                        ? ''
                        : typeof cellValue === 'string' ||
                            typeof cellValue === 'number' ||
                            typeof cellValue === 'boolean' ||
                            React.isValidElement(cellValue)
                          ? cellValue
                          : String(cellValue);

                    return (
                      <React.Fragment key={`${row.id}-${column.id}`}>
                        <span className='truncate pr-2 text-xs font-medium text-muted-foreground'>
                          {headerString}:
                        </span>
                        <span className='truncate text-sm'>{displayValue}</span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {/* Pagination for Mobile */}
        {enablePagination && totalRecords > pageSize ? (
          <div className='mt-6'>
            <EnhancedPagination
              totalRecords={totalRecords}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={onPageChange}
              variant={paginationVariant}
              isMobile={isMobile}
            />
          </div>
        ) : null}
      </>
    );
  }

  // Desktop View Logic
  return (
    <>
      <div className='w-full overflow-x-auto rounded-md border'>
        <Table className={tableClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'px-4 py-3 transition-colors',
                      header.column.getCanSort() && 'cursor-pointer hover:bg-gray-100',
                      headerClassName
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='text-sm font-semibold'>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                      {header.column.getCanSort() && (
                        <span className='flex items-center'>
                          {{
                            asc: <ChevronUp className='h-4 w-4 text-gray-600' />,
                            desc: <ChevronDown className='h-4 w-4 text-gray-600' />
                          }[header.column.getIsSorted() as string] ?? (
                            <ChevronsUpDown className='h-4 w-4 text-gray-400' />
                          )}
                        </span>
                      )}
                    </div>
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
                    <TableCell key={cell.id} className={cellClassName}>
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

      {/* Pagination for Desktop */}
      {enablePagination && totalRecords > pageSize && (
        <div className='mt-6'>
          <EnhancedPagination
            totalRecords={totalRecords}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={onPageChange}
            variant={paginationVariant}
            isMobile={isMobile}
          />
        </div>
      )}
    </>
  );
};

export default CommonTable;
