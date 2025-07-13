'use client';

import React from 'react';
import { Zap, Shuffle, BarChart, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { AnimatedFinancialElement } from './animated-financial-element';

const ProblemSolutionSection = () => {
  const problems = [
    {
      icon: <Shuffle className='h-8 w-8 text-rose-500 dark:text-rose-400' />,
      text: 'Scattered financial data across multiple apps and spreadsheets?'
    },
    {
      icon: <AlertTriangle className='h-8 w-8 text-amber-500 dark:text-amber-400' />,
      text: 'Surprised by overspending at the end of the month?'
    },
    {
      icon: <BarChart className='h-8 w-8 text-indigo-500 dark:text-indigo-400' />,
      text: 'Unclear about your true investment performance or debt status?'
    }
  ];

  return (
    <section className='animated-section lp-bg-dark-section px-6 py-20'>
      <div className='container mx-auto'>
        <AnimatedFinancialElement className='section-title-anim mb-12 text-center'>
          <h2 className='lp-text-dark-section-heading text-3xl font-bold tracking-tight sm:text-4xl'>
            Stop Juggling, Start Thriving
          </h2>
        </AnimatedFinancialElement>
        <AnimatedFinancialElement className='section-subtitle-anim mb-12 text-center' delay={0.1}>
          <p className='lp-text-dark-section-paragraph mt-4 text-lg'>
            Common financial frustrations we help you conquer.
          </p>
        </AnimatedFinancialElement>
        <div className='grid gap-8 md:grid-cols-3'>
          {problems.map((problem, index) => (
            <AnimatedFinancialElement
              key={index}
              delay={0.1 * index}
              className='animated-card dark:bg-slate-850/70 rounded-xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-lg backdrop-blur-sm dark:border-slate-600/50'
            >
              <div className='mb-4 flex justify-center'>{problem.icon}</div>
              <p className='text-center text-slate-300 dark:text-slate-300'>{problem.text}</p>
            </AnimatedFinancialElement>
          ))}
        </div>
        <AnimatedFinancialElement delay={0.3} className='section-content-anim mt-16 text-center'>
          <Lightbulb className='mx-auto mb-4 h-12 w-12 text-sky-500 dark:text-sky-400' />
          <h3 className='lp-text-dark-section-heading text-2xl font-semibold'>
            Expense Pro is Your Unified Solution
          </h3>
          <p className='lp-text-dark-section-paragraph mx-auto mt-3 max-w-2xl'>
            We bring all your financial pieces together with intelligent tools, giving you clarity
            and control like never before.
          </p>
        </AnimatedFinancialElement>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
