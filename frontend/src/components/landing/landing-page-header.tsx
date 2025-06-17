'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const LandingPageHeader = () => {
  return (
    <header className='glassmorphism-nav fixed top-0 left-0 z-50 w-full px-4 py-4 backdrop-blur-sm sm:px-6'>
      <div className='container mx-auto flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2 text-2xl font-bold'>
          <Image
            src='/favicon.svg'
            alt='Expense Pro Logo'
            width={32}
            height={32}
            className='transition-transform duration-300 hover:rotate-12'
          />
          <span className='bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent max-sm:text-sm'>
            Expense Pro
          </span>
        </Link>
        <nav className='hidden items-center gap-4 md:flex'>
          <Link
            href='#features'
            className='text-muted-foreground hover:text-primary text-sm font-medium transition-colors'
          >
            Features
          </Link>
          <Link
            href='#how-it-works'
            className='text-muted-foreground hover:text-primary text-sm font-medium transition-colors'
          >
            How It Works
          </Link>
          <Link
            href='/pricing'
            className='text-muted-foreground hover:text-primary text-sm font-medium transition-colors'
          >
            Pricing
          </Link>
          <Link
            href='/support/contact'
            className='text-muted-foreground hover:text-primary text-sm font-medium transition-colors'
          >
            Contact
          </Link>
        </nav>
        <div className='flex items-center gap-1'>
          <Link href='/auth/login'>
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm transition-colors'
            >
              Login
            </Button>
          </Link>
          <Link href='/auth/signup'>
            <Button
              size='sm'
              variant='cta'
              className='text-sm text-white shadow-md transition-all hover:shadow-sky-500/40'
            >
              Sign Up Free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default LandingPageHeader;
