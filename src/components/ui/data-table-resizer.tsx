import React from 'react';
import { Header } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface DataTableResizerProps<T extends object> {
  header: Header<T, unknown>;
}

export function DataTableResizer<T extends object>({ header }: DataTableResizerProps<T>) {
  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className={cn(
        'bg-border/50 absolute top-0 right-0 h-full w-1.5 cursor-col-resize touch-none rounded-full opacity-0 transition-all select-none group-hover:opacity-100',
        header.column.getIsResizing() && 'is-resizing bg-primary opacity-100'
      )}
    />
  );
}
