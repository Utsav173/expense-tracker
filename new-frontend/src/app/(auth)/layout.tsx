// src/app/(auth)/layout.tsx
import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Authentication',
  description: 'Authentication for your Expense Manager application',
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100'>
      <div className='w-full max-w-md rounded-md bg-white p-6 shadow-md'>
        <h1 className='mb-4 text-center text-2xl font-bold text-gray-800'>Expense Tracker</h1>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
