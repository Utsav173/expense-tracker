import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',

        success: 'border-success/20 bg-success/10 text-success',
        warning: 'border-warning/20 bg-warning/10 text-warning-foreground',
        info: 'border-info/20 bg-info/10 text-info',
        account: 'border-account/20 bg-account/10 text-account',
        transaction: 'border-transaction/20 bg-transaction/10 text-transaction',
        planning: 'border-planning/20 bg-planning/10 text-planning',
        category: 'border-category/20 bg-category/10 text-category',

        'success-muted': 'bg-success/10 text-success border-success/20',
        'destructive-muted': 'bg-destructive/10 text-destructive border-destructive/20',
        'warning-muted': 'bg-warning/10 text-warning-foreground border-warning/20'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, BadgeVariants {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
