'use client';

import { BGPattern } from '@/components/landing/bg-pattern';
import UserProfile from '@/components/ui/user-profile';

const ProfilePage = () => {
  return (
    <>
      <BGPattern variant='dots' mask='fade-center' className='absolute inset-0 z-[-10] size-full' />
      <div className='z-20 mx-auto my-auto p-4 max-sm:p-1'>
        <UserProfile />
      </div>
    </>
  );
};

export default ProfilePage;
