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
  sortIconSize?: string;
  headerHoverClass?: string;
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

  // const [sortOptions, setSortOptions] = useState<{ id: string; label: string }[]>([]);

  // const handleSortingChange = useCallback(
  //   (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
  //     const newSorting =
  //       typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;

  //     setSorting(newSorting);
  //     if (onSortChange && newSorting.length > 0) {
  //       onSortChange(newSorting);
  //     }
  //   },
  //   [onSortChange, sorting]
  // );

  // const handleMobileSortChange = (value: string) => {
  //   const [id, desc] = value.split('-');
  //   const newSorting: SortingState = [{ id, desc: desc === 'desc' }];
  //   handleSortingChange(newSorting);
  // };

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
      onSortChange(sorting);
    }
  }, [sorting, onSortChange]);

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
      <div className='flex items-center justify-center'>
        <Loader />
      </div>
    );
  }

  if (!data.length) {
    return <div className='py-8 text-center text-gray-500'>No results.</div>;
  }

  if (isMobile && columns.length > 2) {
    const triggerColumns = mobileTriggerColumns
      ? table.getAllLeafColumns().filter((col) => mobileTriggerColumns.includes(col.id))
      : table
          .getAllLeafColumns()
          .filter((column) => column.getCanSort())
          .slice(0, 2);

    return (
      <>
        <Select
          value={
            sorting.length ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : undefined
          }
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
        <Accordion type='multiple' className='mt-4 w-full'>
          {table.getRowModel().rows.map((row) => (
            <AccordionItem key={row.id} value={row.id}>
              <AccordionTrigger>
                <div className='flex w-full justify-between text-left'>
                  {triggerColumns.map((column) => (
                    <span key={column.id} className='max-w-[50%] truncate'>
                      {flexRender(column.columnDef.cell, { row, column } as CellContext<T, any>)}
                    </span>
                  ))}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className='grid w-full grid-cols-[35%_65%] gap-y-2'>
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
                      <React.Fragment key={column.id + cellValue}>
                        <span className='truncate pr-2 font-medium'>{headerString}:</span>
                        <span className='truncate'>{cellValue}</span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
                      header.id !== 'actions' && 'cursor-pointer hover:bg-gray-100',
                      headerClassName
                    )}
                    onClick={
                      header.id !== 'actions' ? header.column.getToggleSortingHandler() : undefined
                    }
                  >
                    <div className='flex items-center justify-between'>
                      <div className='text-sm font-semibold'>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                      {header.id !== 'actions' && (
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

      {/* Pagination */}
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
