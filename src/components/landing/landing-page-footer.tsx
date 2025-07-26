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
    <footer className='border-border bg-background border-t py-12 md:py-16'>
      <div className='container mx-auto px-6'>
        <div className='grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16'>
          {/* Brand & CTA Section */}
          <div className='col-span-12 md:col-span-4 lg:col-span-5'>
            <div className='flex items-center gap-2'>
              <Image src='/favicon.svg' alt='Expense Pro Logo' width={32} height={32} />
              <span className='text-foreground text-xl font-bold'>Expense Pro</span>
            </div>
            <p className='text-muted-foreground mt-4 max-w-sm text-base leading-relaxed'>
              Your intelligent partner for mastering personal finance. Gain clarity, build habits,
              and achieve your goals.
            </p>
            <div className='mt-6'>
              <Link href='/auth/signup'>
                <Button variant='cta' className='group'>
                  Get Started Free
                  <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                </Button>
              </Link>
            </div>
          </div>

          {/* Links Section */}
          <div className='col-span-12 grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 lg:col-span-7'>
            <div>
              <h3 className='text-foreground text-sm font-semibold tracking-wider uppercase'>
                Product
              </h3>
              <ul className='mt-4 space-y-3'>
                {productLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground hover:text-primary text-base transition-colors'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className='text-foreground text-sm font-semibold tracking-wider uppercase'>
                Company
              </h3>
              <ul className='mt-4 space-y-3'>
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground hover:text-primary text-base transition-colors'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className='text-foreground text-sm font-semibold tracking-wider uppercase'>
                Legal
              </h3>
              <ul className='mt-4 space-y-3'>
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground hover:text-primary text-base transition-colors'
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
        <div className='border-border mt-12 border-t pt-6'>
          <p className='text-muted-foreground text-center text-sm'>
            © {new Date().getFullYear()} Expense Pro. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingPageFooter;
