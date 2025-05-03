'use client';

import UserProfile from '@/components/ui/user-profile';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

// Dynamically import Particles to avoid SSR issues
const Particles = dynamic(() => import('@/components/ui/particles').then((mod) => mod.Particles), {
  ssr: false
});

const ProfilePage = () => {
  const theme = useTheme();
  return (
    <>
      <Particles
        className='absolute inset-0'
        quantity={100}
        ease={80}
        color={theme.theme === 'dark' ? '#fff' : '#000'}
        refresh
      />
      <div className='z-20 mx-auto my-auto p-4'>
        <UserProfile />
      </div>
    </>
  );
};

export default ProfilePage;
