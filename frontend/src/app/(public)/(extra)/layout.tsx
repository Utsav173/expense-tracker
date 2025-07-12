import React from 'react';
import LandingPageHeader from '@/components/landing/landing-page-header';
import LandingPageFooter from '@/components/landing/landing-page-footer';

import '../../globals.css';

export default function PublicPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-background flex min-h-screen flex-col'>
      <LandingPageHeader />
      <main className='flex-1 pt-16'>{children}</main>
      <LandingPageFooter />
    </div>
  );
}
