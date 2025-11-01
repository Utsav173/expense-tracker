
import React, { Suspense, lazy } from 'react';
import { helpSections } from '@/content/help';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import Loader from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import HelpNavigation from './HelpNavigation';

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
    <div className='from-background via-background to-muted/20 min-h-screen bg-gradient-to-br'>
      {/* Hero Section */}
      <header className='relative overflow-hidden'>
        <div className='from-primary/5 to-secondary/10 absolute inset-0 bg-gradient-to-br via-transparent' />

        <div className='relative px-6 py-12 text-center max-sm:py-4'>
          <div className='mx-auto max-w-4xl'>
            <div className='mb-8 inline-flex items-center justify-center'>
              <div className='relative'>
                <div className='from-primary to-secondary absolute inset-0 animate-pulse rounded-full bg-gradient-to-r opacity-30 blur-lg' />
                <div className='from-primary/10 to-secondary/10 border-primary/20 relative flex h-16 w-16 items-center justify-center rounded-full border bg-gradient-to-r'>
                  <Icon name='lifeBuoy' className='text-primary h-8 w-8' />
                </div>
              </div>
            </div>

            <h1 className='from-foreground via-foreground to-foreground/70 mb-6 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl'>
              Help Center
            </h1>

            <p className='text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed md:text-xl'>
              Master every feature with our comprehensive guides, tutorials, and expert tips.
            </p>

            <div className='text-muted-foreground/70 mt-8 flex flex-wrap items-center justify-center gap-2 text-sm'>
              <span className='flex items-center gap-1.5'>
                <div className='h-2 w-2 rounded-full bg-green-500' />
                Updated daily
              </span>
              <span className='text-muted-foreground/30'>•</span>
              <span className='flex items-center gap-1.5'>
                <Icon name='clock' className='h-3 w-3' />
                ~5 min read each
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className='relative'>
        <div className='mx-auto max-w-7xl px-6 py-8 lg:py-12'>
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12'>
            <HelpNavigation />

            {/* Content */}
            <main className='lg:col-span-9'>
              <article className='border-border/50 bg-card/20 prose prose-sm dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:inline-flex prose-headings:items-baseline prose-headings:gap-2 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-li:my-2 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-md prose-code:bg-muted prose-code:text-foreground prose-code:rounded-md prose-code:px-1.5 prose-code:py-1 mx-auto max-w-full overflow-hidden rounded-2xl border px-2 shadow-lg backdrop-blur-sm md:px-6 md:py-3'>
                <Suspense
                  fallback={
                    <div className='flex items-center justify-center py-12'>
                      <div className='text-center'>
                        <Loader className='mx-auto mb-4' />
                        <p className='text-muted-foreground text-sm'>Loading content...</p>
                      </div>
                    </div>
                  }
                >
                  {helpSections.map((section, index) => {
                    const MdxComponent = mdxComponents[section.id];
                    if (!MdxComponent) return null;
                    return (
                      <section
                        key={section.id}
                        id={section.id}
                        className={cn(
                          'scroll-mt-20',
                          index > 0 && 'border-border/30 mt-8 border-t pt-8'
                        )}
                      >
                        <MdxComponent />
                      </section>
                    );
                  })}
                </Suspense>
              </article>

              {/* Footer CTA */}
              <div className='mt-12 text-center'>
                <div className='border-border/50 from-primary/5 to-secondary/5 rounded-2xl border bg-gradient-to-r p-8'>
                  <Icon
                    name='messageCircleQuestion'
                    className='text-primary mx-auto mb-4 h-12 w-12'
                  />
                  <h3 className='mb-3 text-xl font-semibold'>Still need help?</h3>
                  <p className='text-muted-foreground mb-6'>
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
                    <Button className='bg-primary/20 hover:bg-primary/90 text-blue-950 dark:text-blue-300'>
                      <Icon name='mail' className='mr-2 h-4 w-4' />
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

