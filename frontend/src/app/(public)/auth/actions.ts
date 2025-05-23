'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { API_BASE_URL } from '../../../lib/api-client';

export async function storeAuthToken(token: string) {
  const cookieStore = await cookies();

  cookieStore.set('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/accounts'
  });
}

export async function storeUser(user: any) {
  const cookieStore = await cookies();
  cookieStore.set('user', JSON.stringify(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/accounts'
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

export async function userLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  cookieStore.delete('user');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to logout from backend');
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export async function userLogin(state: any, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return {
      error: 'Please enter email and password',
      prevState: state
    };
  }

  const result = loginSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
      prevState: state
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Failed to login');
    }

    const { data } = await response.json();

    if (data.error) {
      return {
        error: data.error,
        prevState: state
      };
    }

    await storeAuthToken(data.token);

    (await cookies()).set('user', JSON.stringify(data.user));

    return { error: '', prevState: state, data: data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Something went wrong',
      prevState: state
    };
  }
}
