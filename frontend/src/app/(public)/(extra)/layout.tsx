import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import '../../globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';

export default function PublicPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      <div className='flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950'>
        <header className='glassmorphism-nav fixed top-0 left-0 z-50 w-full px-4 py-4 sm:px-6'>
          <div className='container mx-auto flex items-center justify-between'>
            <Link href='/' className='flex items-center gap-2 text-2xl font-bold'>
              <Image
                src='/favicon.svg'
                alt='Expense Pro Logo'
                width={32}
                height={32}
                className='transition-transform duration-300 hover:rotate-12'
              />
              <span className='bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent'>
                Expense Pro
              </span>
            </Link>
            <nav className='hidden items-center gap-4 md:flex'>
              <Link
                href='/#features'
                className='text-sm font-medium text-slate-700 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400'
              >
                Features
              </Link>
              <Link
                href='/#pricing'
                className='text-sm font-medium text-slate-700 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400'
              >
                Pricing
              </Link>
              <Link
                href='/support/contact'
                className='text-sm font-medium text-slate-700 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400'
              >
                Contact
              </Link>
            </nav>
            <div className='flex items-center gap-2'>
              <Link href='/auth/login'>
                <Button
                  variant='ghost'
                  className={cn(
                    'text-sm text-slate-700 transition-colors hover:bg-slate-200/60 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-sky-400'
                  )}
                >
                  Login
                </Button>
              </Link>
              <Link href='/auth/signup'>
                <Button className='bg-gradient-to-r from-sky-500 to-cyan-500 text-sm text-white shadow-md transition-all hover:from-sky-600 hover:to-cyan-600 hover:shadow-sky-500/40'>
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <main className='flex-1 pt-16'>{children}</main> {/* Added pt-16 for fixed header */}
        <footer className='border-t border-slate-200 bg-slate-100 px-6 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400'>
          <div className='container mx-auto'>
            <p>© {new Date().getFullYear()} Expense Pro. All rights reserved.</p>
            <div className='mt-2 flex justify-center gap-4'>
              <Link
                href='/legal/privacy-policy'
                className='transition-colors hover:text-sky-500 dark:hover:text-sky-400'
              >
                Privacy Policy
              </Link>
              <Link
                href='/legal/terms-of-service'
                className='transition-colors hover:text-sky-500 dark:hover:text-sky-400'
              >
                Terms of Service
              </Link>
              <Link
                href='/support/contact'
                className='transition-colors hover:text-sky-500 dark:hover:text-sky-400'
              >
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
