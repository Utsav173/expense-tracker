import React from 'react';
import Link from 'next/link';

const LandingPageFooter = () => {
  return (
    <footer className='bg-slate-950 px-6 py-12 text-center text-sm'>
      <div className='container mx-auto'>
        <p className='text-slate-400'>
          © {new Date().getFullYear()} Expense Pro. All rights reserved. Built with passion &
          precision.
        </p>
        <div className='mt-4 flex justify-center gap-6'>
          <Link
            href='/legal/privacy-policy'
            className='text-slate-400 transition-colors hover:text-sky-400'
          >
            Privacy Policy
          </Link>
          <Link
            href='/legal/terms-of-service'
            className='text-slate-400 transition-colors hover:text-sky-400'
          >
            Terms of Service
          </Link>
          <Link
            href='/support/contact'
            className='text-slate-400 transition-colors hover:text-sky-400'
          >
            Contact Support
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default LandingPageFooter;
