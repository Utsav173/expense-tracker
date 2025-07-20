import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AuthPageTitleProps {
  title: string;
  className?: string;
}

export const AuthPageTitle: React.FC<AuthPageTitleProps> = ({ title, className }) => {
  return (
    <>
      <h1
        sr-only
        hidden
        className={cn(
          'bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] bg-clip-text text-center text-3xl font-bold text-transparent select-none',
          className
        )}
      >
        {title}
      </h1>
      <Image
        src='/favicon.svg'
        alt='Expense Pro Logo'
        width={62}
        height={62}
        className='mx-auto mb-0'
      />
    </>
  );
};
