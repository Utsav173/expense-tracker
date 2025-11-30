'use client';

import React, { Suspense, lazy } from 'react';
import { helpSections } from '@/content/help';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import Loader from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import HelpNavigation from './HelpNavigation';
import HelpSearch from './HelpSearch';
import { motion } from 'framer-motion';

const GettingStarted = lazy(() => import('@/content/help/getting-started.mdx'));
const Dashboard = lazy(() => import('@/content/help/dashboard.mdx'));
const Transactions = lazy(() => import('@/content/help/transactions.mdx'));
const Accounts = lazy(() => import('@/content/help/accounts.mdx'));
const Planning = lazy(() => import('@/content/help/planning.mdx'));
const AiAssistant = lazy(() => import('@/content/help/ai-assistant.mdx'));
const DataManagement = lazy(() => import('@/content/help/data-management.mdx'));
const ProfileSettings = lazy(() => import('@/content/help/profile-settings.mdx'));

const mdxComponents: { [key: string]: React.ComponentType } = {
  'getting-started': GettingStarted,
  dashboard: Dashboard,
  transactions: Transactions,
  accounts: Accounts,
  planning: Planning,
  'ai-assistant': AiAssistant,
  'data-management': DataManagement,
  'profile-settings': ProfileSettings
};

export default function HelpPageClient() {
  return (
    <div className='bg-background selection:bg-primary/20 selection:text-primary min-h-screen'>
      {/* Hero Section */}
      <header className='border-border/40 bg-background/50 relative z-20 border-b backdrop-blur-xl'>
        <div className='bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0' />
        <div className='from-background/5 via-background/50 to-background absolute inset-0 bg-linear-to-b' />

        <div className='relative mx-auto max-w-5xl px-6 py-16 text-center lg:py-24'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='mb-8 inline-flex items-center justify-center'>
              <div className='group relative cursor-default'>
                <div className='bg-primary/20 absolute inset-0 rounded-full opacity-50 blur-xl transition-all duration-500 group-hover:blur-2xl' />
                <div className='from-primary/10 to-primary/5 border-primary/20 relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-linear-to-br shadow-lg backdrop-blur-sm transition-transform duration-500 group-hover:scale-105'>
                  <Icon name='lifeBuoy' className='text-primary h-8 w-8' />
                </div>
              </div>
            </div>

            <h1 className='text-foreground mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl'>
              How can we <span className='text-primary'>help</span> you?
            </h1>

            <p className='text-muted-foreground mx-auto mb-10 max-w-2xl text-lg md:text-xl'>
              Search our knowledge base for guides, tutorials, and answers to common questions.
            </p>

            <div className='mx-auto mb-12 max-w-2xl'>
              <HelpSearch />
            </div>

            <div className='text-muted-foreground/80 flex flex-wrap justify-center gap-4 text-sm'>
              <div className='bg-muted/50 border-border/50 flex items-center gap-2 rounded-full border px-3 py-1.5'>
                <Icon name='zap' className='h-3.5 w-3.5 text-amber-500' />
                <span>Quick Start Guide</span>
              </div>
              <div className='bg-muted/50 border-border/50 flex items-center gap-2 rounded-full border px-3 py-1.5'>
                <Icon name='sparkles' className='h-3.5 w-3.5 text-purple-500' />
                <span>AI Assistant Tips</span>
              </div>
              <div className='bg-muted/50 border-border/50 flex items-center gap-2 rounded-full border px-3 py-1.5'>
                <Icon name='shield' className='h-3.5 w-3.5 text-green-500' />
                <span>Security Best Practices</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className='relative'>
        <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12'>
            <HelpNavigation />

            {/* Content */}
            <main className='min-w-0 lg:col-span-9'>
              <article className='border-border/50 bg-card/20 prose prose-sm dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-li:my-2 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-md prose-code:bg-muted prose-code:text-foreground prose-code:rounded-md prose-code:px-1.5 prose-code:py-1 mx-auto max-w-full overflow-hidden rounded-2xl border px-2 shadow-lg backdrop-blur-sm md:px-6 md:py-3 [&_:is(h2,h3)_span]:inline-flex [&_:is(h2,h3)_span]:items-center [&_:is(h2,h3)_span]:gap-2'>
                <Suspense
                  fallback={
                    <div className='flex flex-col items-center justify-center space-y-4 py-24'>
                      <Loader className='text-primary h-8 w-8' />
                      <p className='text-muted-foreground animate-pulse'>
                        Loading documentation...
                      </p>
                    </div>
                  }
                >
                  {helpSections.map((section, index) => {
                    const MdxComponent = mdxComponents[section.id];
                    if (!MdxComponent) return null;
                    return (
                      <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        key={section.id}
                        id={section.id}
                        className={cn(
                          'scroll-mt-28',
                          index > 0 && 'border-border/40 mt-16 border-t pt-16'
                        )}
                      >
                        <div className='mt-1 mb-8 flex items-center gap-4'>
                          <Icon name={section.icon} className='text-primary h-6 w-6' />
                          <h2 className='text-foreground m-0! text-3xl font-bold tracking-tight'>
                            {section.title}
                          </h2>
                        </div>
                        <MdxComponent />
                      </motion.section>
                    );
                  })}
                </Suspense>
              </article>

              {/* Footer CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className='mt-24'
              >
                <div className='border-border/50 bg-card relative rounded-3xl border p-8 text-center md:p-12'>
                  <div className='from-primary/5 to-secondary/5 absolute inset-0 bg-linear-to-br via-transparent' />
                  <div className='relative z-10'>
                    <div className='bg-primary/10 text-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl'>
                      <Icon name='messageCircleQuestion' className='h-8 w-8' />
                    </div>
                    <h3 className='mb-3 text-2xl font-bold'>Still need help?</h3>
                    <p className='text-muted-foreground mx-auto mb-8 max-w-lg text-lg'>
                      Can't find what you're looking for? Our support team is here to help you get
                      back on track.
                    </p>
                    <div className='flex flex-col justify-center gap-4 sm:flex-row'>
                      <Button size='lg' className='rounded-full px-8'>
                        <Icon name='mail' className='mr-2 h-4 w-4' />
                        Contact Support
                      </Button>
                      <Button variant='outline' size='lg' className='rounded-full px-8'>
                        <Icon name='messageSquare' className='mr-2 h-4 w-4' />
                        Community Forum
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
