'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Icon } from './icon';

interface QueryErrorDisplayProps {
  error: any;
  title?: string;
  message?: string;
  className?: string;
  noFill?: boolean;
}

const QueryErrorDisplay: React.FC<QueryErrorDisplayProps> = ({
  error,
  title = 'Oops! Something went wrong.',
  message,
  className,
  noFill = false
}) => {
  if (!error) return null;

  const errorMessage = (error as Error)?.message || 'An unknown error occurred.';

  return (
    <div
      className={cn(
        noFill
          ? 'flex h-auto items-center justify-center p-2'
          : 'flex h-full min-h-[calc(100vh-20rem)] w-full items-center justify-center p-4',
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className='w-full max-w-md'
      >
        <Alert variant='destructive'>
          <Icon name='alertCircle' className='h-4 w-4' />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>
            {message}
            <div className='text-muted-foreground mt-2 text-xs'>Error: {errorMessage}</div>
          </AlertDescription>
        </Alert>
      </motion.div>
    </div>
  );
};

export default QueryErrorDisplay;
