'use client';

import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { helpSections } from '@/content/help';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import Loader from '@/components/ui/loader';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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

export default function HelpPage() {
  const [activeId, setActiveId] = useState('getting-started');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
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
      { rootMargin: '-100px 0px -70% 0px', threshold: 0.1 }
    );
    const elements = allIds.map((id) => document.getElementById(id)).filter(Boolean);
    elements.forEach((el) => observer.observe(el!));
    return () => elements.forEach((el) => observer.unobserve(el!));
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
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

  const TableOfContents = () => (
    <nav aria-label='Help sections navigation' className='space-y-1'>
      <h2 className='text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase'>
        Table of Contents
      </h2>
      <ul className='space-y-1' role='list'>
        {helpSections.map((item) => (
          <li key={item.id} role='listitem'>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              aria-current={
                activeId === item.id || item.subsections?.some((sub) => sub.id === activeId)
                  ? 'page'
                  : undefined
              }
              className={cn(
                'flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors duration-200',
                activeId === item.id || item.subsections?.some((sub) => sub.id === activeId)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              <Icon name={item.icon} className='h-5 w-5' aria-hidden='true' />
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className='bg-background min-h-screen'>
      <header className='from-primary/5 via-background to-secondary/5 relative bg-gradient-to-br px-4 py-12 text-center md:py-16'>
        <Icon
          name='lifeBuoy'
          className='bg-primary/10 text-primary mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full shadow-lg md:h-12 md:h-24 md:w-12 md:w-24'
          aria-hidden='true'
        />
        <h1 className='mb-4 text-3xl font-extrabold tracking-tighter md:text-4xl lg:text-5xl'>
          Help Center
        </h1>
        <p className='text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed md:text-lg'>
          Everything you need to know to become an Expense Pro power user.
        </p>
      </header>

      <div className='bg-background/95 sticky top-16 z-40 border-b shadow-sm backdrop-blur-md md:hidden'>
        <div className='px-4 py-3'>
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant='outline'
                className='flex w-full items-center justify-between'
                aria-expanded={isMobileSheetOpen}
                aria-controls='mobile-navigation'
              >
                <div className='flex items-center gap-3'>
                  <Icon name='menu' className='h-4 w-4' aria-hidden='true' />
                  <span className='truncate text-sm font-medium'>
                    {currentSection?.title || 'Navigation'}
                  </span>
                </div>
                <Icon
                  name='chevronDown'
                  className='text-muted-foreground h-4 w-4'
                  aria-hidden='true'
                />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-full max-w-xs p-4' id='mobile-navigation'>
              <SheetHeader className='mb-4 text-left'>
                <SheetTitle>Help Topics</SheetTitle>
              </SheetHeader>
              <TableOfContents />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className='container mx-auto max-w-7xl px-4 py-8'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          <aside className='hidden lg:col-span-1 lg:block' aria-label='Desktop navigation'>
            <div className='sticky top-24 space-y-4 rounded-lg border p-6 shadow-sm'>
              <TableOfContents />
            </div>
          </aside>

          <main className='lg:col-span-3' role='main' aria-label='Help content'>
            <article className='prose prose-sm dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:inline-flex prose-headings:items-baseline prose-headings:gap-2 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-li:my-2 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-md prose-code:bg-muted prose-code:text-foreground prose-code:rounded-md prose-code:px-1.5 prose-code:py-1 mx-auto max-w-full'>
              <Suspense
                fallback={
                  <div
                    className='flex min-h-[50vh] items-center justify-center'
                    role='status'
                    aria-label='Loading help content'
                  >
                    <Loader />
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
                      aria-labelledby={`${section.id}-title`}
                      className={cn(
                        'scroll-mt-24 max-sm:scroll-mt-12',
                        index > 0 && 'mt-16 border-t pt-12 max-sm:mt-8 max-sm:pt-6'
                      )}
                    >
                      <MdxComponent />
                    </section>
                  );
                })}
              </Suspense>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
