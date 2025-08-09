'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Lock, Bell, BrainCircuit } from 'lucide-react';
import { ProfileInformationForm } from '@/components/profile/profile-information-form';
import { NotificationSettingsForm } from '@/components/profile/notification-settings-form';
import { AiSettingsForm } from '@/components/profile/ai-settings-form';
import { PasswordSettingsForm } from '@/components/profile/password-settings-form';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'ai';

const ProfilePage = () => {
  const { isLoading: userIsLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const navItems = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Assistant', icon: BrainCircuit }
  ];

  if (userIsLoading) {
    return (
      <div className='mx-auto max-w-6xl p-4 sm:p-8'>
        <Skeleton className='mb-8 h-10 w-64' />
        <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
          <div className='md:col-span-1'>
            <div className='flex flex-col space-y-2'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          </div>
          <div className='md:col-span-3'>
            <Skeleton className='h-[500px] w-full' />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileInformationForm />;
      case 'notifications':
        return <NotificationSettingsForm />;
      case 'ai':
        return <AiSettingsForm />;
      case 'security':
        return <PasswordSettingsForm />;
      default:
        return null;
    }
  };

  return (
    <div className='mx-auto w-full max-w-6xl p-4 sm:p-8'>
      <h1 className='mb-8 text-3xl font-bold'>Profile Space</h1>
      <div className='grid grid-cols-1 gap-8 md:grid-cols-[1fr_3fr]'>
        <aside>
          <nav className='flex flex-row space-x-1 overflow-x-auto pb-2 md:flex-col md:space-y-1 md:space-x-0 md:overflow-x-visible'>
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className='shrink-0 justify-start'
                onClick={() => setActiveTab(item.id as SettingsTab)}
              >
                <item.icon className='mr-2 h-4 w-4' />
                <span className='truncate'>{item.label}</span>
              </Button>
            ))}
          </nav>
        </aside>

        <main>{renderContent()}</main>
      </div>
    </div>
  );
};

export default ProfilePage;
