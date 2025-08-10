import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        success:
          'border-transparent bg-green-500 text-white shadow hover:bg-green-500/80 dark:bg-green-600 dark:hover:bg-green-600/80',
        warning:
          'border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80 dark:bg-yellow-600 dark:hover:bg-yellow-600/80',
        outline:
          'text-foreground border-input bg-background hover:bg-accent hover:text-accent-foreground',
        'success-outline':
          'text-green-600 border-green-200 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900',
        'warning-outline':
          'text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950 dark:hover:bg-yellow-900'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
