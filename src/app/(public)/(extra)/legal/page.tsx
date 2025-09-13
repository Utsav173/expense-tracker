import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

const LegalPage = () => {
  return (
    <div className='bg-background min-h-screen px-4 py-16 sm:py-24'>
      <div className='container mx-auto max-w-4xl'>
        <header className='mb-12 text-center'>
          <Icon
            name='scale'
            className='mx-auto mb-4 h-16 w-16 text-primary dark:text-primary-foreground'
          />
          <h1 className='text-foreground text-4xl font-bold md:text-5xl'>Legal Information</h1>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-xl'>
            Understand your rights and our policies.
          </p>
        </header>

        <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
          <Link href='/legal/privacy-policy' className='group block h-full'>
            <Card className='group-hover:border-primary/50 flex h-full flex-col items-center justify-center p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-[1px] hover:shadow-xl'>
              <Icon
                name='shieldAlert'
                className='text-primary mb-4 h-12 w-12 transition-colors group-hover:text-primary-foreground'
              />
              <CardHeader className='p-0'>
                <CardTitle className='text-lg font-semibold'>Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className='text-muted-foreground mt-2 text-sm'>
                Learn how we collect, use, and protect your data.
              </CardContent>
            </Card>
          </Link>

          <Link href='/legal/terms-of-service' className='group block h-full'>
            <Card className='group-hover:border-primary/50 flex h-full flex-col items-center justify-center p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-[1px] hover:shadow-xl'>
              <Icon
                name='fileText'
                className='text-primary mb-4 h-12 w-12 transition-colors group-hover:text-primary-foreground'
              />
              <CardHeader className='p-0'>
                <CardTitle className='text-lg font-semibold'>Terms of Service</CardTitle>
              </CardHeader>
              <CardContent className='text-muted-foreground mt-2 text-sm'>
                Read the terms and conditions for using our service.
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
