import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL!,
  fetchOptions: { credentials: 'include' },
  plugins: [emailOTPClient()],
  advanced:
    process.env.NODE_ENV === 'production'
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: '.khatriutsav.com'
          },
          defaultCookieAttributes: {
            sameSite: 'none',
            secure: true,
            partitioned: true
          }
        }
      : {}
});

export const Session = authClient.$Infer.Session;
