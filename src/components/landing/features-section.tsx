'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, ShieldCheck, Lightbulb, BarChart, BellRing } from 'lucide-react';
import { gsap } from 'gsap';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <Card className='feature-card-anim flex flex-col items-center p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
    <div className='bg-primary/10 text-primary mb-4 rounded-full p-3'>{icon}</div>
    <CardTitle className='mb-2 text-xl font-semibold'>{title}</CardTitle>
    <CardContent className='text-muted-foreground text-sm'>{description}</CardContent>
  </Card>
);

const FeaturesSection = () => {
  const featuresRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      '.feature-card-anim',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
  }, []);

  const features = [
    {
      icon: <DollarSign className='h-6 w-6' />,
      title: 'Smart Expense Tracking',
      description: 'Effortlessly log and categorize your spending with intelligent suggestions.'
    },
    {
      icon: <TrendingUp className='h-6 w-6' />,
      title: 'AI-Powered Insights',
      description: 'Get personalized financial advice and spending analysis powered by AI.'
    },
    {
      icon: <ShieldCheck className='h-6 w-6' />,
      title: 'Bank-Grade Security',
      description:
        'Your financial data is protected with advanced encryption and security protocols.'
    },
    {
      icon: <Lightbulb className='h-6 w-6' />,
      title: 'Goal-Oriented Planning',
      description:
        'Set and achieve your financial goals with clear, actionable steps and progress tracking.'
    },
    {
      icon: <BarChart className='h-6 w-6' />,
      title: 'Comprehensive Reporting',
      description: 'Visualize your financial health with detailed charts and customizable reports.'
    },
    {
      icon: <BellRing className='h-6 w-6' />,
      title: 'Automated Reminders',
      description: 'Never miss a bill payment or financial milestone with smart notifications.'
    }
  ];

  return (
    <section className='from-background to-muted bg-gradient-to-b py-20'>
      <div className='container mx-auto px-4 text-center'>
        <h2 className='text-foreground mb-4 text-4xl font-bold'>Unlock Your Financial Potential</h2>
        <p className='text-muted-foreground mx-auto mb-12 max-w-3xl text-lg'>
          Expense Pro offers a suite of powerful features designed to simplify your financial life
          and help you make smarter decisions.
        </p>
        <div ref={featuresRef} className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
