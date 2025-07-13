'use client';

import UserProfile from '@/components/ui/user-profile';
import dynamic from 'next/dynamic';

const BGPattern = dynamic(
  () => import('@/components/landing/bg-pattern').then((mod) => mod.BGPattern),
  { ssr: false }
);

const ProfilePage = () => {
  return (
    <>
      <BGPattern mask='fade-center' className='absolute inset-0 z-[-10] size-full' />
      <div className='z-20 mx-auto my-auto p-4 max-sm:p-1'>
        <UserProfile />
      </div>
    </>
  );
};

export default ProfilePage;
