'use client';

import dynamic from 'next/dynamic';
import UserProfile from '@/components/user-profile';

// Dynamically import Particles to avoid SSR issues
const Particles = dynamic(() => import('@/components/ui/particles').then((mod) => mod.Particles), {
  ssr: false
});

const ProfilePage = () => {
  return (
    <>
      <Particles className='absolute inset-0' quantity={100} ease={80} color={'#000000'} refresh />
      <div className='mx-auto my-auto p-4'>
        <UserProfile />
      </div>
    </>
  );
};

export default ProfilePage;
