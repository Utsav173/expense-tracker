import { cn } from '@/lib/utils';
import React from 'react';

const BentoGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid w-full auto-rows-[minmax(180px,auto)] grid-cols-12 gap-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BentoGrid.displayName = 'BentoGrid';

const BentoGridItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group bento-grid-item relative col-span-12 flex h-full flex-col justify-between overflow-hidden rounded-xl', // Added bento-grid-item class
          'bg-card border-border border shadow-md', // Use bg-card, border-border, and a standard shadow for light mode
          'dark:bg-card dark:border-border transform-gpu dark:shadow-lg', // Use dark:bg-card, dark:border-border, and a slightly stronger shadow for dark mode
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BentoGridItem.displayName = 'BentoGridItem';

export { BentoGrid, BentoGridItem };
