'use client';

import { FeatureSpotlight } from './feature-spotlight';
import { featuresData } from '@/lib/data/features-landing';

export const FeatureDeepDiveSection = () => {
  return (
    <section id='features' className='bg-muted space-y-24 py-24'>
      {featuresData.map((feature, index) => (
        <FeatureSpotlight key={feature.id} {...feature} reverseLayout={index % 2 !== 0} />
      ))}
    </section>
  );
};
