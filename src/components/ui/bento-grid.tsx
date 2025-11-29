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

const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  children
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'group/bento hover:shadow-primary/5 row-span-1 flex flex-col justify-between space-y-4 rounded-2xl border border-black/5 bg-white/5 p-4 shadow-lg backdrop-blur-md transition duration-200 hover:bg-white hover:shadow-2xl dark:border-white/10 dark:bg-black/5 dark:hover:bg-black',
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          {header}
          <div className='transition duration-200 group-hover/bento:translate-x-2'>
            {icon}
            <div className='text-foreground mt-2 mb-2 font-bold'>{title}</div>
            <div className='text-muted-foreground text-xs font-normal'>{description}</div>
          </div>
        </>
      )}
    </div>
  );
};
BentoGridItem.displayName = 'BentoGridItem';

export { BentoGrid, BentoGridItem };
