import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AnimatedFinancialElement } from './animated-financial-element';

interface InfoPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon: ReactNode;
}

const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ children, title, subtitle, icon }) => {
  return (
    <div className='bg-bg-default text-text-body min-h-screen px-4 pt-24 pb-12'>
      <div className='container mx-auto max-w-4xl'>
        <AnimatedFinancialElement delay={0.1}>
          <div className='mb-8'>
            <Link href='/'>
              <Button
                variant='ghost'
                className='text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              >
                <ArrowLeft size={18} className='mr-2' />
                Back to Home
              </Button>
            </Link>
          </div>
        </AnimatedFinancialElement>

        <AnimatedFinancialElement delay={0.2}>
          <header className='mb-12 text-center'>
            {icon}
            <h1 className='text-text-heading text-4xl font-extrabold tracking-tight sm:text-5xl'>
              {title}
            </h1>
            {subtitle && <p className='text-text-body/80 mt-3 text-lg'>{subtitle}</p>}
            <p className='text-muted-foreground mt-3 text-sm'>
              Last Updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </header>
        </AnimatedFinancialElement>

        <AnimatedFinancialElement delay={0.3}>{children}</AnimatedFinancialElement>
      </div>
    </div>
  );
};

export default InfoPageLayout;
