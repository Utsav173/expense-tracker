'use cache';

import React from 'react';
import { helpSections } from '@/content/help';
import { FAQPage, WithContext } from 'schema-dts';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { cacheLife } from 'next/cache';

const HelpPageClient = dynamic(() => import('@/components/help/help-page-client'));

const jsonLd: WithContext<FAQPage> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: helpSections.flatMap((section) =>
    section.subsections
      ? section.subsections.map((subsection) => ({
          '@type': 'Question',
          name: subsection.title,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Learn about ${subsection.title} in our detailed guide. Visit the ${section.title} section for more information.`
          }
        }))
      : [
          {
            '@type': 'Question',
            name: section.title,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Find comprehensive information about ${section.title} in our help center.`
            }
          }
        ]
  )
};

export default async function HelpPage() {
  cacheLife('max');

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HelpPageClient />
    </>
  );
}
