'use client';

import apiFetch from '@/lib/api-client';
import { getAuthToken } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
  preferredCurrency?: string;
}

const fetchUser = async (): Promise<User | undefined> => {
  const token = getAuthToken();
  if (!token) return undefined;
  return apiFetch<User>('/auth/me', 'GET', undefined, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

function UserProfile() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetchUser(),
    retry: false,
  });

  if (isLoading) {
    return <div>Loading user profile...</div>;
  }

  if (error) {
    return <div>Error fetching profile data: {error.message}</div>;
  }

  if (!user) return <div>Please login to see the profile</div>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
      {user.profilePic && <img src={user.profilePic} alt='User Profile' />}
      {user.preferredCurrency && <p>Preferred Currency: {user.preferredCurrency}</p>}
    </div>
  );
}

export default UserProfile;
