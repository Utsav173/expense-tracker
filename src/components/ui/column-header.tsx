'use client';

import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Icon } from './icon'; // Make sure you have an Icon component

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sortDirection = column.getIsSorted();

  return (
    <div
      className={cn('group flex cursor-pointer items-center space-x-2 select-none', className)}
      onClick={() => column.toggleSorting()}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          column.toggleSorting();
        }
      }}
      aria-label={`Sort by ${title}`}
    >
      <span
        className={cn(
          'font-semibold',
          sortDirection ? 'text-primary' : 'group-hover:text-foreground'
        )}
      >
        {title}
      </span>
      {sortDirection === 'desc' ? (
        <Icon name='arrowDown' className='text-primary h-4 w-4' />
      ) : sortDirection === 'asc' ? (
        <Icon name='arrowUp' className='text-primary h-4 w-4' />
      ) : (
        <Icon
          name='chevronsUpDown'
          className='text-muted-foreground/70 group-hover:text-foreground h-4 w-4'
        />
      )}
    </div>
  );
}
