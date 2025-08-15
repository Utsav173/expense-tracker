import * as React from 'react';
import { Slot as SlotPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // --- CORRECTED VARIANTS ---
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active',
        success:
          'bg-success text-success-foreground hover:bg-success-hover active:bg-success-active',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline',

        // --- ALREADY CORRECT ---
        account:
          'bg-account text-account-foreground border-b-4 border-b-account-border-b hover:bg-account-hover active:border-b-0 active:bg-account-active active:translate-y-1',
        transaction:
          'bg-transaction text-transaction-foreground border-b-4 border-b-transaction-border-b hover:bg-transaction-hover active:border-b-0 active:bg-transaction-active active:translate-y-1',
        planning:
          'bg-planning text-planning-foreground border-b-4 border-b-planning-border-b hover:bg-planning-hover active:border-b-0 active:bg-planning-active active:translate-y-1',
        category:
          'bg-category text-category-foreground border-b-4 border-b-category-border-b hover:bg-category-hover active:border-b-0 active:bg-category-active active:translate-y-1'
      },
      size: {
        default: 'h-10 px-3 py-1',
        sm: 'h-9 rounded-md px-2',
        lg: 'h-11 rounded-md px-5',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? SlotPrimitive.Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
