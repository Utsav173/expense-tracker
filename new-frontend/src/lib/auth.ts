import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

// Function to get the authentication token from cookie
export const getAuthToken = async() => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    return token;
  } catch (e) {
    return null;
  }
}

// Function to decode the auth token
export function decodeAuthToken(token: string | null | undefined) {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (e) {
    console.log(e);
    return null;
  }
}

// check if current user is authorized or not
export async function isAuthorized() {
  const token = await getAuthToken();
  const decoded = decodeAuthToken(token);
  return !!decoded;
}

// Function to get the authentication token from localStorage (client-side)
export function getAuthTokenClient() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('token');
}
