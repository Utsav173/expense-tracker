import { jwtDecode } from 'jwt-decode';
import { getAuthToken } from '@/app/(public)/auth/actions';

export function decodeAuthToken(token: string | null | undefined) {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function isAuthorized() {
  const token = await getAuthToken();
  const decoded = decodeAuthToken(token);
  return !!decoded;
}

export function getAuthTokenClient() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('token');
}
