'use client';

import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';

import LandingPageHeader from '@/components/landing/landing-page-header';
import LandingPageFooter from '@/components/landing/landing-page-footer';
import HeroSection from '@/components/landing/hero-section';
import FeaturesSection from '@/components/landing/features-section';
import HowItWorksSection from '@/components/landing/how-it-works-section';
import TestimonialsSection from '@/components/landing/testimonials-section';
import CallToActionSection from '@/components/landing/call-to-action-section';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LandingPageContent = () => {
  const mainRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={mainRef}
      className={cn('min-h-screen overflow-x-hidden antialiased select-none', 'bg-background')}
    >
      <LandingPageHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CallToActionSection />
      <LandingPageFooter />
    </div>
  );
};

const LandingPage = () => {
  return <LandingPageContent />;
};

export default LandingPage;
