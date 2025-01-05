'use server';

import { cookies } from 'next/headers';

// Function to store the auth token in a server-side cookie
export async function storeAuthToken(token: string) {
  const cookieStore = await cookies();

  cookieStore.set('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function removeAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}