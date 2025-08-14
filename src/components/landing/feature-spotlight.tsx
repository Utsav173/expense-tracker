'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';
import { imageToTheme } from '@/lib/data/features-landing';
import { Icon } from '../ui/icon';

interface FeatureSpotlightProps {
  id: string;
  headline: string;
  description: string;
  bullets: string[];
  reverseLayout?: boolean;
  theme: 'light' | 'dark';
}

export const FeatureSpotlight = ({
  headline,
  description,
  bullets,
  reverseLayout,
  id,
  theme
}: FeatureSpotlightProps) => {
  return (
    <div className='container mx-auto'>
      <div
        className={cn(
          'grid grid-cols-1 items-center gap-12 md:grid-cols-2',
          reverseLayout && 'md:grid-flow-col-dense'
        )}
      >
        <div className={cn('md:order-1', reverseLayout && 'md:order-2')}>
          <Card className='overflow-hidden shadow-2xl'>
            <Image
              src={imageToTheme[id as keyof typeof imageToTheme][theme]}
              alt={headline}
              width={1200}
              height={800}
              className='object-cover'
            />
          </Card>
        </div>
        <div className={cn('md:order-2', reverseLayout && 'md:order-1')}>
          <h3 className='text-4xl font-bold tracking-tight'>{headline}</h3>
          <p className='text-muted-foreground mt-4 text-lg'>{description}</p>
          <ul className='mt-8 space-y-4'>
            {bullets.map((bullet, i) => (
              <li key={i} className='flex items-start'>
                <Icon name='check' className='text-primary mt-1 mr-3 h-6 w-6 flex-shrink-0' />
                <span className='text-base'>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
