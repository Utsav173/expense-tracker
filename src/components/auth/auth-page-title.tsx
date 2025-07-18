import React from 'react';
import { cn } from '@/lib/utils';

interface AuthPageTitleProps {
  title: string;
  className?: string;
}

export const AuthPageTitle: React.FC<AuthPageTitleProps> = ({ title, className }) => {
  return (
    <h1 className={cn(
      'bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] bg-clip-text text-center text-3xl font-bold text-transparent select-none',
      className
    )}>
      {title}
    </h1>
  );
};
