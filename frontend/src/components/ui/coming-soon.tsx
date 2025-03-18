'use client';

import React from 'react';
import { Wrench } from 'lucide-react';

interface ComingSoonProps {
  message?: string;
  className?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ message = 'Coming Soon!', className }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 text-muted-foreground ${
        className || ''
      }`}
    >
      <Wrench className='mb-4 h-16 w-16 animate-spin text-muted-foreground' />
      <p className='text-center text-sm font-medium'>{message}</p>
      <p className='text-center text-xs text-gray-500'>
        This feature is currently under development.
      </p>
    </div>
  );
};

export default ComingSoon;
