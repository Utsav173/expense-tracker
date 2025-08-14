import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

const NotFoundPage = () => {
  return (
    <Card variant='auth'>
      <CardContent className='space-y-6 p-0 pt-4'>
        <div className='space-y-2 text-center select-none'>
          <Icon name='frown' className='text-primary mx-auto mb-4 h-16 w-16' />
          <h2 className='text-foreground text-3xl font-semibold'>404 - Page Not Found</h2>
          <p className='text-muted-foreground text-sm'>
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
      </CardContent>
      <CardFooter className='flex flex-col items-center justify-between gap-2 pt-4 sm:flex-row'>
        <Button asChild variant='outline'>
          <Link href='/auth/login'>Go to Login</Link>
        </Button>
        <Button asChild>
          <Link href='/accounts'>Go to Dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotFoundPage;
