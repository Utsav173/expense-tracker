'use client';

import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { helpSections } from '@/content/help';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import Loader from '@/components/ui/loader';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FAQPage, WithContext } from 'schema-dts';
import Script from 'next/script';

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

interface TocItem {
  id: string;
  title: string;
  subsections?: TocItem[];
}

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
            text: `Find the answer to "${subsection.title}" in the ${section.title} section.`
          }
        }))
      : [
          {
            '@type': 'Question',
            name: section.title,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Find the answer in the ${section.title} section.`
            }
          }
        ]
  )
};

export default function HelpPage() {
  const [activeId, setActiveId] = useState('getting-started');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    const allIds = helpSections.flatMap((s) => [
      s.id,
      ...(s.subsections?.map((sub) => sub.id) || [])
    ]);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            return;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    const elements = allIds.map((id) => document.getElementById(id)).filter(Boolean);
    elements.forEach((el) => observer.observe(el!));
    return () => elements.forEach((el) => observer.unobserve(el!));
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.pushState(null, '', `#${id}`);
      setActiveId(id);
      setIsMobileSheetOpen(false);
    }
  };

  const currentSection = useMemo(() => {
    return helpSections.find(
      (section) =>
        section.id === activeId || section.subsections?.some((sub) => sub.id === activeId)
    );
  }, [activeId]);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return helpSections;
    const lowercasedQuery = searchQuery.toLowerCase();
    return helpSections.filter(
      (section) =>
        section.title.toLowerCase().includes(lowercasedQuery) ||
        section.subsections?.some((sub) => sub.title.toLowerCase().includes(lowercasedQuery))
    );
  }, [searchQuery]);

  const TableOfContents = () => (
    <div className='space-y-0.5'>
      {filteredSections.map((item) => (
        <div key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(e) => handleLinkClick(e, item.id)}
            aria-current={
              activeId === item.id || item.subsections?.some((sub) => sub.id === activeId)
                ? 'page'
                : undefined
            }
            className={cn(
              'group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out',
              activeId === item.id || item.subsections?.some((sub) => sub.id === activeId)
                ? 'from-primary/8 via-primary/2 to-primary/0 text-primary bg-gradient-to-r shadow-sm'
                : 'text-muted-foreground hover:from-muted/60 hover:to-muted/40 hover:text-foreground hover:bg-gradient-to-r'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-200'
              )}
            >
              <Icon name={item.icon} className='h-4 w-4' aria-hidden='true' />
            </div>
            <span className='truncate font-medium'>{item.title}</span>

            {(activeId === item.id || item.subsections?.some((sub) => sub.id === activeId)) && (
              <div className='bg-primary ml-auto h-2 w-2 animate-pulse rounded-full' />
            )}
          </a>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

        {/* Mobile Navigation */}
        <div className='border-border/50 bg-background/80 sticky top-16 z-40 border-b backdrop-blur-md md:hidden'>
          <div className='px-4 py-3'>
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='bg-background/50 hover:bg-background/80 w-full justify-between'
                >
                  <div className='flex items-center gap-2.5'>
                    <Icon name='menu' className='h-4 w-4' />
                    <span className='truncate text-sm font-medium'>
                      {currentSection?.title || 'Help Topics'}
                    </span>
                  </div>
                  <Icon name='chevronDown' className='text-muted-foreground h-4 w-4' />
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-full max-w-sm p-6'>
                <SheetHeader className='mb-6'>
                  <SheetTitle className='text-left text-lg font-semibold'>Help Topics</SheetTitle>
                </SheetHeader>
                <TableOfContents />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <div className='relative'>
          <div className='mx-auto max-w-7xl px-6 py-8 lg:py-12'>
            <div className='grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12'>
              {/* Sidebar */}
              <aside className='hidden lg:col-span-3 lg:block'>
                <div className='sticky top-20'>
                  <div className='border-border/50 bg-card/30 rounded-2xl border p-6 shadow-lg backdrop-blur-sm'>
                    <div className='mb-4 flex items-center gap-2'>
                      <Icon name='bookOpen' className='text-primary h-5 w-5' />
                      <h2 className='text-foreground font-semibold'>Navigation</h2>
                    </div>
                    <TableOfContents />
                  </div>

                  {/* Progress Indicator */}
                  <div className='border-border/50 bg-card/20 mt-6 rounded-xl border p-4'>
                    <div className='mb-2 flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Reading Progress</span>
                      <span className='text-primary font-medium'>
                        {Math.round(
                          ((helpSections.findIndex(
                            (s) =>
                              s.id === activeId || s.subsections?.some((sub) => sub.id === activeId)
                          ) +
                            1) /
                            helpSections.length) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className='bg-muted/30 h-1.5 w-full rounded-full'>
                      <div
                        className='from-primary to-secondary h-1.5 rounded-full bg-gradient-to-r transition-all duration-300'
                        style={{
                          width: `${((helpSections.findIndex((s) => s.id === activeId || s.subsections?.some((sub) => sub.id === activeId)) + 1) / helpSections.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </aside>

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
    </>
  );
}
