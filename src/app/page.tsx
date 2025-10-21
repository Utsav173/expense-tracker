'use client';

import React from 'react';
import { cn } from '@/lib/utils';

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
  return (
    <>
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
