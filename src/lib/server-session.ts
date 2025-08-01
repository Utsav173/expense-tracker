import { cookies } from 'next/headers';
import { Session } from './auth-client';

const SERVER_URL = 'https://ai-expense-tracker-hmzp.onrender.com/api/auth/get-session';
const LOCAL_SERVER_URL = 'http://localhost:1337/api/auth/get-session';

const getServerSession = async (): Promise<typeof Session | null> => {
  try {
    const cookieHeader = (await cookies()).toString();

    const res = await fetch(SERVER_URL, {
      credentials: 'include',
      headers: {
        Cookie: cookieHeader
      }
    });

    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default getServerSession;
