'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Header } from '@tanstack/react-table';
import { Icon } from './icon';

export function DataTableResizer<TData, TValue>({ header }: { header: Header<TData, TValue> }) {
  const isResizing = header.column.getIsResizing();

  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className={cn(
        'absolute top-0 right-0 z-10 flex h-full w-4 cursor-col-resize touch-none items-center justify-center opacity-0 select-none group-hover/th:opacity-100',
        isResizing && 'opacity-100'
      )}
      aria-hidden='true'
      data-resizing={isResizing ? 'true' : undefined}
    >
      <div className='flex h-4/5 items-center justify-center'>
        <Separator
          orientation='vertical'
          decorative={false}
          className={cn('h-4/5 w-0.5 transition-colors duration-200', {
            'bg-primary': isResizing,
            'bg-border': !isResizing
          })}
        />
        <Icon
          name='gripVertical'
          className={cn('text-muted-foreground/70 absolute h-4 w-4', {
            'text-primary': isResizing
          })}
        />
      </div>
    </div>
  );
}
