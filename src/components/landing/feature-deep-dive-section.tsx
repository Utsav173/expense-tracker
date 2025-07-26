'use client';

import { useTheme } from 'next-themes';
import { FeatureSpotlight } from './feature-spotlight';
import { featuresData } from '@/lib/data/features-landing';

export const FeatureDeepDiveSection = () => {
  const { resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <section id='features' className='bg-muted space-y-24 py-24 max-sm:px-3'>
      {featuresData.map((feature, index) => (
        <FeatureSpotlight
          key={feature.id}
          theme={currentTheme}
          {...feature}
          reverseLayout={index % 2 !== 0}
        />
      ))}
    </section>
  );
};
