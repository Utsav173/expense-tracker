import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL!,
  fetchOptions: { credentials: 'include' },
  plugins: [emailOTPClient()]
});

export const Session = authClient.$Infer.Session;
