'use client';

import { Particles } from '@/components/ui/particles';
import UserProfile from '@/components/user-profile';

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
