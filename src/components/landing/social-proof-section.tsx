'use client';

import React from 'react';

export const SocialProofSection = () => {
  return (
    <section className='bg-background py-16'>
      <div className='container mx-auto px-4 text-center'>
        <p className='text-muted-foreground text-sm font-semibold tracking-widest uppercase'>
          Trusted by smart money managers
        </p>
        <div className='mt-8 grid grid-cols-2 items-center justify-center gap-8 md:grid-cols-4'>
          <div className='text-center'>
            <p className='text-4xl font-bold'>10K+</p>
            <p className='text-muted-foreground text-sm'>Active Users</p>
          </div>
          <div className='text-center'>
            <p className='text-4xl font-bold'>4.9/5</p>
            <p className='text-muted-foreground text-sm'>User Rating</p>
          </div>
          <div className='text-center'>
            <p className='text-4xl font-bold'>$1M+</p>
            <p className='text-muted-foreground text-sm'>Tracked Monthly</p>
          </div>
          <div className='text-center'>
            <p className='text-4xl font-bold'>AI</p>
            <p className='text-muted-foreground text-sm'>Powered Insights</p>
          </div>
        </div>
      </div>
    </section>
  );
};
