'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface AuthContextType {
  session: any;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isPending: isLoading } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-otp',
    '/auth/verify-invitation',
    '/legal/privacy-policy',
    '/legal/terms-of-service',
    '/support/contact',
    '/support/feedback'
  ];

  const isPublicPath = publicRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!isLoading) {
      if (!session && !isPublicPath) {
        router.replace('/auth/login');
      } else if (session && (pathname === '/auth/login' || pathname === '/auth/signup')) {
        router.replace('/accounts');
      }
    }
  }, [session, isLoading, isPublicPath, pathname, router]);

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
