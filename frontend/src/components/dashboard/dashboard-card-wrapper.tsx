'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardWrapperProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  gridSpanClass: string;
  isExpanded: boolean;
  isHidden: boolean;
  onExpandToggle: (id: string) => void;
  onVisibilityToggle: (id: string) => void;
  noPadding?: boolean;
  className?: string;
}

export const DashboardCardWrapper: React.FC<DashboardCardWrapperProps> = ({
  id,
  title,
  description,
  children,
  gridSpanClass,
  isExpanded,
  isHidden,
  onExpandToggle,
  onVisibilityToggle,
  noPadding = false,
  className
}) => {
  if (isHidden && !isExpanded) return null;

  return (
    <Card
      className={cn(
        'flex flex-col transition-all duration-300 ease-in-out',
        isExpanded ? 'col-span-12 !h-auto' : gridSpanClass,
        isHidden ? 'border-dashed opacity-50' : '',
        className
      )}
    >
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2 pt-4'>
        <div className='flex-1 pr-4'>
          <CardTitle className='text-base font-semibold md:text-lg'>{title}</CardTitle>
          {description && (
            <CardDescription className='text-xs md:text-sm'>{description}</CardDescription>
          )}
        </div>
        <div className='flex items-center space-x-1'>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={() => onExpandToggle(id)}
            disabled={isHidden}
            aria-label={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className='h-4 w-4' /> : <Maximize2 className='h-4 w-4' />}
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={() => onVisibilityToggle(id)}
            aria-label={isHidden ? 'Show Section' : 'Hide Section'}
          >
            {isHidden ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
          </Button>
        </div>
      </CardHeader>
      <CardContent
        className={cn('flex flex-1 flex-col', noPadding ? 'p-0' : isExpanded ? 'p-4' : 'p-4 pt-0')}
      >
        {children}
      </CardContent>
    </Card>
  );
};
