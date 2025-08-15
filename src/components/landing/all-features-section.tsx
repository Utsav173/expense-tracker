'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { featuresList } from '@/lib/data/features-list';
import { Icon } from '../ui/icon';

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

        <div className='mt-16 grid grid-cols-3 gap-6 max-sm:grid-cols-1'>
          {featuresList.map((feature) => {
            return (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className='group block h-full transform-gpu transition-all duration-300 hover:-translate-y-[1px]'
              >
                <Card className='group-hover:border-primary/50 flex h-full flex-col p-6 shadow-lg group-hover:shadow-2xl'>
                  <CardHeader className='p-0'>
                    <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg'>
                      <Icon name={feature.icon} className='h-6 w-6' />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardDescription className='mt-2 flex-grow'>
                    {feature.description}
                  </CardDescription>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
