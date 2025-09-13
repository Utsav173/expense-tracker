import Loader from '@/components/ui/loader';
import React, { Suspense } from 'react';

export default function UtilityLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loader className='absolute inset-0 flex items-center justify-center' />}>
      {children}
    </Suspense>
  );
}
