import * as React from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentProps<'input'> {
  variant?: 'default' | 'auth';
}

function Input({ className, type, variant = 'default', ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'border-border bg-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        {
          'border-border bg-background focus:bg-card focus:ring-primary w-full rounded-lg border px-4 py-2 transition-all duration-200 focus:border-transparent focus:ring-2':
            variant === 'auth'
        },
        className
      )}
      {...props}
    />
  );
}

export { Input };
