'use client';
import React from 'react';
import { BrainCircuit, LayoutGrid, TrendingUp, Target, FileText, Scale } from 'lucide-react';
import { AnimatedFinancialElement } from './animated-financial-element';
import AnimatedFeatureCardV2 from './animated-feature-card-v2';

const FeaturesSection = () => {
  const features = [
    {
      icon: <BrainCircuit size={28} strokeWidth={1.5} className='text-white' />,
      title: 'AI-Powered Co-pilot',
      description: 'Add expenses, ask questions, and get insights via a natural chat interface.'
    },
    {
      icon: <LayoutGrid size={28} strokeWidth={1.5} className='text-white' />,
      title: 'Unified Dashboard',
      description: 'See your complete financial picture at a glance with customizable widgets.'
    },
    {
      icon: <TrendingUp size={28} strokeWidth={1.5} className='text-white' />,
      title: 'Investment Tracking',
      description: 'Monitor your portfolio, track holdings, and see real-time performance.'
    },
    {
      icon: <Target size={28} strokeWidth={1.5} className='text-white' />,
      title: 'Smart Budgeting',
      description: 'Set monthly or yearly budgets for categories and track your spending progress.'
    },
    {
      icon: <FileText size={28} strokeWidth={1.5} className='text-white' />,
      title: 'Data Automation',
      description: 'Effortlessly import transactions from XLSX or PDF bank statements.'
    },
    {
      icon: <Scale size={28} strokeWidth={1.5} className='text-white' />,
      title: 'Debt & Loan Management',
      description: 'Track money you owe and money owed to you with clear due dates.'
    }
  ];

  return (
    <section id='features' className='bg-slate-900 px-6 py-24'>
      <div className='container mx-auto'>
        <AnimatedFinancialElement className='section-title-anim mb-12 text-center'>
          <h2 className='text-4xl font-bold text-white md:text-5xl'>
            Powerful Features, Simple Interface
          </h2>
        </AnimatedFinancialElement>
        <AnimatedFinancialElement className='section-subtitle-anim mb-16 text-center' delay={0.1}>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-slate-300'>
            Expense Pro provides comprehensive tools in a user-friendly package to help you manage
            every aspect of your finances.
          </p>
        </AnimatedFinancialElement>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, i) => (
            <AnimatedFeatureCardV2
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={i * 0.08}
              className='bg-slate-800/60 backdrop-blur-sm hover:border-sky-500/60 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-sky-400/50'
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
