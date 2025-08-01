'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '../theme-toggle';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/support/contact' }
];

const LandingPageHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const menuVariants: Variants = {
    initial: { opacity: 0, y: '-100%' },
    animate: { opacity: 1, y: '0%', transition: { duration: 0.4, ease: 'easeInOut' } },
    exit: { opacity: 0, y: '-100%', transition: { duration: 0.3, ease: 'easeInOut' } }
  };

  const navItemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <>
      <header className='glassmorphism-nav fixed top-0 left-0 z-50 w-full px-4 py-4 backdrop-blur-sm sm:px-6'>
        <div className='container mx-auto flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2 text-2xl font-bold'>
            <Image
              src='/favicon.svg'
              alt='Expense Pro Logo'
              width={32}
              height={32}
              className='-mb-0.5'
            />
            <span className='max-sm:text-sm'>Expense Pro</span>
          </Link>

          <nav className='hidden items-center gap-4 md:flex'>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className='text-muted-foreground hover:text-primary text-sm font-medium transition-colors'
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className='hidden items-center gap-2 md:flex'>
            <ModeToggle />
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

          <div className='flex items-center gap-2 md:hidden'>
            <ModeToggle />
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label='Toggle mobile menu'
            >
              <AnimatePresence mode='wait' initial={false}>
                {isMenuOpen ? (
                  <motion.div
                    key='close'
                    initial={{ rotate: -90, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: 90, scale: 0.5 }}
                  >
                    <X className='h-6 w-6' />
                  </motion.div>
                ) : (
                  <motion.div
                    key='open'
                    initial={{ rotate: 90, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: -90, scale: 0.5 }}
                  >
                    <Menu className='h-6 w-6' />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={menuVariants}
            initial='initial'
            animate='animate'
            exit='exit'
            className='bg-background fixed inset-0 z-40 flex h-screen flex-col p-4 pt-24'
          >
            <nav className='flex flex-col items-center gap-8'>
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  variants={navItemVariants}
                  initial='initial'
                  animate='animate'
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className='text-muted-foreground hover:text-primary text-2xl font-semibold transition-colors'
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className='mt-auto flex flex-col gap-4'>
              <motion.div
                variants={navItemVariants}
                initial='initial'
                animate='animate'
                transition={{ delay: 0.6 }}
              >
                <Link href='/auth/login'>
                  <Button variant='outline' size='lg' className='w-full'>
                    Login
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                variants={navItemVariants}
                initial='initial'
                animate='animate'
                transition={{ delay: 0.7 }}
              >
                <Link href='/auth/signup'>
                  <Button size='lg' variant='cta' className='w-full'>
                    Sign Up Free
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingPageHeader;
