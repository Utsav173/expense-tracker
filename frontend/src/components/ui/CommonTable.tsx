'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getPaginationRowModel,
  SortingState,
  HeaderContext,
  Row,
  Column
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
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
  mobilePrimaryColumns?: string[];
  paginationVariant?: 'default' | 'minimalist' | 'pill';
}

// Helper function to get a Header instance for a column
const getHeaderInstance = <T extends object>(
  table: ReturnType<typeof useReactTable<T>>,
  columnId: string
): HeaderContext<T, unknown> | undefined => {
  const firstHeaderGroup = table.getHeaderGroups()[0];
  const header = firstHeaderGroup?.headers.find((h) => h.column.id === columnId);
  return header?.getContext();
};

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
  mobilePrimaryColumns,
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
    manualSorting: !!onSortChange,
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

  useEffect(() => {
    const propSorting: SortingState =
      sortBy && sortOrder ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [];
    const currentInternalId = sorting[0]?.id;
    const currentInternalDesc = sorting[0]?.desc;
    const propId = propSorting[0]?.id;
    const propDesc = propSorting[0]?.desc;

    if (currentInternalId !== propId || currentInternalDesc !== propDesc) {
      setSorting(propSorting);
    }
  }, [sortBy, sortOrder]);

  const sortOptions = useMemo(() => {
    return table
      .getAllLeafColumns()
      .filter((column) => column.getCanSort() && column.id !== 'actions')
      .flatMap((column) => [
        {
          id: `${column.id}-asc`,
          label: `Sort by ${column.columnDef.header?.toString() || column.id} (Asc)`,
          value: `${column.id}-asc`
        },
        {
          id: `${column.id}-desc`,
          label: `Sort by ${column.columnDef.header?.toString() || column.id} (Desc)`,
          value: `${column.id}-desc`
        }
      ]);
  }, [table]);

  const primaryMobileCols = useMemo(() => {
    const allCols = table.getAllLeafColumns().filter((col) => col.id !== 'actions');
    if (mobilePrimaryColumns && mobilePrimaryColumns.length > 0) {
      return allCols.filter((col) => mobilePrimaryColumns.includes(col.id));
    }
    return allCols.filter((col) => col.getCanSort()).slice(0, 1);
  }, [table, mobilePrimaryColumns]);

  const otherMobileCols = useMemo(() => {
    return table
      .getAllLeafColumns()
      .filter(
        (col) => col.id !== 'actions' && !primaryMobileCols.some((pCol) => pCol.id === col.id)
      );
  }, [table, primaryMobileCols]);

  const actionColumn = useMemo(
    () => table.getAllLeafColumns().find((col) => col.id === 'actions'),
    [table]
  );

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className='text-muted-foreground py-8 text-center'>No results found.</div>;
  }

  // Mobile Card View Logic
  if (isMobile && columns.length > 2) {
    return (
      <>
        {onSortChange && sortOptions.length > 0 && (
          <Select
            value={sorting.length ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : 'none'}
            onValueChange={(value) => {
              if (value === 'none') {
                setSorting([]);
              } else if (value) {
                const [id, order] = value.split('-');
                setSorting([{ id, desc: order === 'desc' }]);
              }
            }}
          >
            <SelectTrigger className='mb-4 w-full'>
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

        <div className='space-y-3'>
          {table.getRowModel().rows.map(
            (
              row: Row<T> // Add type Row<T>
            ) => (
              <Card key={row.id} className='overflow-hidden'>
                <CardHeader className='flex flex-row items-start justify-between p-4 pb-2'>
                  <div className='flex-1 space-y-1 pr-2'>
                    {primaryMobileCols.map((col) => {
                      const cell = row.getVisibleCells().find((c) => c.column.id === col.id);
                      return cell ? (
                        <CardTitle key={col.id} className='text-base leading-snug font-semibold'>
                          {flexRender(col.columnDef.cell, cell.getContext())}
                        </CardTitle>
                      ) : null;
                    })}
                  </div>
                  {actionColumn && (
                    <div className='flex-shrink-0'>
                      {flexRender(
                        actionColumn.columnDef.cell,
                        row
                          .getVisibleCells()
                          .find((c) => c.column.id === actionColumn.id)!
                          .getContext()
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className='grid min-w-0 grid-cols-[auto_1fr] gap-x-3 gap-y-3 p-4 pt-1 text-sm'>
                  {otherMobileCols.map((col: Column<T, unknown>) => {
                    const cell = row.getVisibleCells().find((c) => c.column.id === col.id);
                    const headerContext = getHeaderInstance(table, col.id);
                    const headerContent = headerContext
                      ? flexRender(col.columnDef.header, headerContext)
                      : col.id;

                    return cell ? (
                      <React.Fragment key={col.id}>
                        <div className='text-muted-foreground text-xs font-medium'>
                          {headerContent}:
                        </div>
                        <div className='truncate'>
                          {flexRender(col.columnDef.cell, cell.getContext())}
                        </div>
                      </React.Fragment>
                    ) : null;
                  })}
                </CardContent>
              </Card>
            )
          )}
        </div>

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
  }

  // Desktop Table View Logic
  return (
    <>
      <div className='w-full overflow-x-auto rounded-md border select-none'>
        <Table className={tableClassName}>
          <TableHeader className={headerClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-muted-foreground px-4 py-3 text-xs font-medium tracking-wider uppercase',
                      header.column.getCanSort() && 'hover:bg-muted cursor-pointer',
                      headerClassName
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className='flex items-center gap-2'>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className='opacity-50 group-hover:opacity-100'>
                          {{
                            asc: <ChevronUp className='h-3.5 w-3.5' />,
                            desc: <ChevronDown className='h-3.5 w-3.5' />
                          }[header.column.getIsSorted() as string] ?? (
                            <ChevronsUpDown className='h-3.5 w-3.5' />
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
                    <TableCell key={cell.id} className={cn('p-4 align-middle', cellClassName)}>
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
