'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Maximize2, Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardWrapperProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  gridSpanClass: string;
  isHidden: boolean;
  onVisibilityToggle: (id: string) => void;
  className?: string;
}

export const DashboardCardWrapper: React.FC<DashboardCardWrapperProps> = ({
  id,
  title,
  icon,
  description,
  children,
  gridSpanClass,
  isHidden,
  onVisibilityToggle,
  className
}) => {
  console.log(icon);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isHidden) return null;

  return (
    <>
      <Card className={cn('flex flex-col', gridSpanClass, className)}>
        <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2 pt-4'>
          <div className='flex-1 pr-4'>
            <CardTitle className='flex items-center gap-2 text-base font-semibold md:text-lg'>
              {icon} {title}
            </CardTitle>
            {description && (
              <CardDescription className='text-xs md:text-sm'>{description}</CardDescription>
            )}
          </div>
          <div className='flex flex-shrink-0 items-center space-x-1'>
            {/* Dialog Trigger Button - Desktop Only */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='hidden h-7 w-7 md:flex' // Hide on mobile, show on md and up
                  disabled={isHidden}
                  aria-label={'Maximize'}
                >
                  <Maximize2 className='h-4 w-4' />
                </Button>
              </DialogTrigger>
              <DialogContent className='max-h-[90vh] !w-[90%] overflow-y-auto sm:max-w-2xl md:max-w-4xl lg:max-w-6xl'>
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <div className={cn('flex-1 p-0')}>{children}</div>
              </DialogContent>
            </Dialog>

            {/* Visibility Toggle Button - Always Visible */}
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
        <CardContent className={cn('flex flex-1 flex-col p-0')}>{children}</CardContent>
      </Card>
    </>
  );
};
