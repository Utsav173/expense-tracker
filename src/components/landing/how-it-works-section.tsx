'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, DollarSign, BarChart, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { features } from '@/lib/data/features'; // Import the features data
import { Button } from '@/components/ui/button';

interface FeatureOverviewCardProps {
  icon: React.ReactNode;
  title: string;
  shortDescription: string;
  slug: string;
}

const FeatureOverviewCard: React.FC<FeatureOverviewCardProps> = ({
  icon,
  title,
  shortDescription,
  slug
}) => (
  <Card className='feature-overview-card-anim flex flex-col items-center p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
    <div className='bg-primary/10 text-primary mb-4 rounded-full p-3'>{icon}</div>
    <CardTitle className='mb-2 text-xl font-semibold'>{title}</CardTitle>
    <CardContent className='text-muted-foreground flex-grow text-sm'>
      {shortDescription}
    </CardContent>
    <Link href={`/features/${slug}`}>
      <Button variant='outline' className='mt-4'>
        Learn More
      </Button>
    </Link>
  </Card>
);

const HowItWorksSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      '.feature-overview-card-anim',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
  }, []);

  // Map icons to features based on their slug or title for display
  const featuresWithIcons = features.map((feature) => {
    let iconComponent;
    switch (feature.slug) {
      case 'smart-expense-tracking':
        iconComponent = <DollarSign className='h-6 w-6' />;
        break;
      case 'ai-powered-insights':
        iconComponent = <Lightbulb className='h-6 w-6' />;
        break;
      case 'bank-grade-security':
        iconComponent = <CheckCircle className='h-6 w-6' />;
        break;
      case 'goal-oriented-planning':
        iconComponent = <BarChart className='h-6 w-6' />;
        break;
      // Add more cases for other features as needed
      default:
        iconComponent = <Lightbulb className='h-6 w-6' />;
    }
    return { ...feature, icon: iconComponent };
  });

  return (
    <section id='how-it-works' className='bg-muted py-20'>
      <div className='container mx-auto px-4 text-center'>
        <h2 className='text-foreground mb-4 text-4xl font-bold'>How Expense Pro Works</h2>
        <p className='text-muted-foreground mx-auto mb-12 max-w-3xl text-lg'>
          Getting started with Expense Pro is simple. Discover the key features that make managing
          your finances effortless.
        </p>
        <div ref={sectionRef} className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {featuresWithIcons.map((feature, index) => (
            <FeatureOverviewCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
