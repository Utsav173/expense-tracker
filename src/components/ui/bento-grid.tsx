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
  children,
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
        'group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-3xl border border-black/5 bg-black/5 p-4 shadow-xl backdrop-blur-md transition duration-200 hover:bg-black/10 hover:shadow-2xl hover:shadow-primary/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
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
            <div className='mb-2 mt-2 font-bold text-foreground'>
              {title}
            </div>
            <div className='text-xs font-normal text-muted-foreground'>
              {description}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
BentoGridItem.displayName = 'BentoGridItem';

export { BentoGrid, BentoGridItem };
