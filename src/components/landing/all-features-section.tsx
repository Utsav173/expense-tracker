'use client';

import React from 'react';
import Link from 'next/link';
import { featuresList } from '@/lib/data/features-list';
import { Icon } from '../ui/icon';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';

export const AllFeaturesSection = () => {
  return (
    <section className='bg-background py-24'>
      <div className='container mx-auto px-4'>
        <div className='text-center'>
          <h2 className='text-4xl font-bold'>All Features at a Glance</h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-lg'>
            Everything you need for comprehensive financial management, all in one place.
          </p>
        </div>

        <BentoGrid className='mt-16'>
          {featuresList.map((feature, i) => {
            const isLarge = i === 0 || i === featuresList.length - 1;
            const isMedium = i === 3 || i === 4;

            return (
              <BentoGridItem
                key={feature.slug}
                className={
                  isLarge
                    ? 'col-span-12 md:col-span-6'
                    : isMedium
                      ? 'col-span-12 md:col-span-4'
                      : 'col-span-12 md:col-span-4'
                }
              >
                <Link
                  href={`/features/${feature.slug}`}
                  className='flex h-full flex-col justify-between p-6'
                >
                  <div>
                    <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg'>
                      <Icon name={feature.icon} className='h-6 w-6' />
                    </div>
                    <h3 className='text-xl font-semibold'>{feature.title}</h3>
                    <p className='text-muted-foreground mt-2 text-sm'>{feature.description}</p>
                  </div>
                </Link>
              </BentoGridItem>
            );
          })}
        </BentoGrid>
      </div>
    </section>
  );
};
