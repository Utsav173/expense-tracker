'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { WebSite, Organization, WithContext } from 'schema-dts';

import LandingPageHeader from '@/components/landing/landing-page-header';
import LandingPageFooter from '@/components/landing/landing-page-footer';
import HeroSection from '@/components/landing/hero-section';
import TestimonialsSection from '@/components/landing/testimonials-section';
import CallToActionSection from '@/components/landing/call-to-action-section';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { FeatureDeepDiveSection } from '@/components/landing/feature-deep-dive-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { AllFeaturesSection } from '@/components/landing/all-features-section'; // New import

const LandingPage = () => {
  const jsonLd: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://expense-pro.khatriutsav.com/',
    name: 'Expense Tracker',
    description:
      'Take control of your finances with an AI-powered expense tracker. Get predictive insights, automated budgeting, and actionable advice to achieve your financial goals.',
    publisher: {
      '@type': 'Organization',
      name: 'Expense Tracker',
      logo: {
        '@type': 'ImageObject',
        url: 'https://expense-pro.khatriutsav.com/favicon-96x96.png'
      }
    }
  };

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className={cn('min-h-screen overflow-x-hidden antialiased select-none', 'bg-background')}
      >
        <LandingPageHeader />
        <main>
          <HeroSection />
          {/* <SocialProofSection /> */}
          <FeatureDeepDiveSection />
          <HowItWorksSection />
          <AllFeaturesSection />
          <TestimonialsSection />
          <CallToActionSection />
        </main>
        <LandingPageFooter />
      </div>
    </>
  );
};

export default LandingPage;
