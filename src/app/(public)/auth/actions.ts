'use server';

import { cookies } from 'next/headers';

export async function storeAuthToken(token: string) {
  const cookieStore = await cookies();

  cookieStore.set('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function storeUser(user: any) {
  const cookieStore = await cookies();
  cookieStore.set('user', JSON.stringify(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30
  });
}

export const getAuthToken = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value;
};

export const getUser = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('user')?.value;
};

export async function removeAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  cookieStore.delete('user');
}
