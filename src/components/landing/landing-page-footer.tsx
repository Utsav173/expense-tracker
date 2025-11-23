import { CurrentYear } from './current-year';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Icon } from '../ui/icon';

const LandingPageFooter = () => {
  const productLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Help Docs', href: '/help' }
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
    <footer className='border-t border-white/10 bg-background py-12 md:py-16'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-12'>
          <div className='lg:col-span-2'>
            <div className='flex items-center justify-center gap-2 sm:justify-start'>
              <Image src='/favicon.svg' alt='Expense Pro Logo' width={28} height={28} />
              <span className='text-xl font-bold tracking-tight text-foreground sm:text-2xl'>
                Expense Pro
              </span>
            </div>
            <p className='mx-auto mt-4 max-w-md text-sm font-medium leading-relaxed text-muted-foreground sm:mx-0 sm:text-base'>
              Your intelligent partner for mastering personal finance. Gain clarity, build habits, and
              achieve your goals.
            </p>
            <div className='mt-6 flex justify-center sm:justify-start'>
              <Link href='/auth/signup'>
                <Button
                  size='sm'
                  className='group rounded-full bg-primary px-6 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/40'
                >
                  Get Started Free
                  <Icon
                    name='arrowRight'
                    className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1'
                  />
                </Button>
              </Link>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-2'>
            <div className='text-center sm:text-left'>
              <h3 className='text-sm font-bold uppercase tracking-wider text-foreground'>
                Product
              </h3>
              <ul className='mt-4 space-y-3'>
                {productLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className='text-center sm:text-left'>
              <h3 className='text-sm font-bold uppercase tracking-wider text-foreground'>
                Company
              </h3>
              <ul className='mt-4 space-y-3'>
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className='text-center sm:text-left'>
              <h3 className='text-sm font-bold uppercase tracking-wider text-foreground'>
                Legal
              </h3>
              <ul className='mt-4 space-y-3'>
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className='text-sm font-medium text-muted-foreground transition-colors hover:text-primary'
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
        <div className='mt-12 border-t border-white/10 pt-8'>
          <Suspense fallback={null}>
            <p className='text-center text-xs font-medium text-muted-foreground sm:text-sm'>
              © <CurrentYear /> Expense Pro. All Rights Reserved.
            </p>
          </Suspense>
        </div>
      </div>
    </footer>
  );
};

export default LandingPageFooter;
