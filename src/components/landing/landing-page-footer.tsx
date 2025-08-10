'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const LandingPageFooter = () => {
  const productLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'How It Works', href: '#how-it-works' }
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/legal/privacy-policy' },
    { name: 'Terms of Service', href: '/legal/terms-of-service' }
  ];

  const companyLinks = [
    { name: 'Contact Us', href: '/support/contact' },
    { name: 'Feedback', href: '/support/feedback' }
  ];

  return (
    <footer className='border-border bg-background border-t py-8 md:py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-12'>
          <div className='lg:col-span-2'>
            <div className='flex items-center justify-center gap-2 sm:justify-start'>
              <Image src='/favicon.svg' alt='Expense Pro Logo' width={28} height={28} />
              <span className='text-foreground text-lg font-bold sm:text-xl'>Expense Pro</span>
            </div>
            <p className='text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed sm:mx-0 sm:text-base lg:mt-4'>
              Your intelligent partner for mastering personal finance. Gain clarity, build habits,
              and achieve your goals.
            </p>
            <div className='mt-4 flex justify-center sm:justify-start lg:mt-6'>
              <Link href='/auth/signup'>
                <Button size='sm' className='group'>
                  Get Started Free
                  <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                </Button>
              </Link>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-2 lg:gap-8'>
            <div className='text-center sm:text-left'>
              <h3 className='text-foreground text-sm font-semibold tracking-wide uppercase'>
                Product
              </h3>
              <ul className='mt-3 space-y-2'>
                {productLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground hover:text-primary text-sm transition-colors'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className='text-center sm:text-left'>
              <h3 className='text-foreground text-sm font-semibold tracking-wide uppercase'>
                Company
              </h3>
              <ul className='mt-3 space-y-2'>
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground hover:text-primary text-sm transition-colors'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className='text-center sm:text-left'>
              <h3 className='text-foreground text-sm font-semibold tracking-wide uppercase'>
                Legal
              </h3>
              <ul className='mt-3 space-y-2'>
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground hover:text-primary text-sm transition-colors'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='border-border mt-8 border-t pt-6 lg:mt-12'>
          <p className='text-muted-foreground text-center text-xs sm:text-sm'>
            © {new Date().getFullYear()} Expense Pro. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingPageFooter;
