'use client';

import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { helpSections } from '@/content/help';
import { Card, CardContent } from '@/components/ui/card';
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
      const yOffset = -100; // Account for fixed header + sticky nav
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
    <nav className='space-y-1'>
      <h3 className='text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase'>
        Table of Contents
      </h3>
      <ul className='space-y-1'>
        {helpSections.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors duration-200',
                activeId === item.id || item.subsections?.some((sub) => sub.id === activeId)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              <Icon name={item.icon} className='h-5 w-5' />
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
        <div className='relative'>
          <div className='bg-primary/10 text-primary mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full shadow-lg md:h-24 md:w-24'>
            <Icon name='lifeBuoy' className='h-10 w-10 md:h-12 md:w-12' />
          </div>
          <h1 className='mb-4 text-3xl font-extrabold tracking-tighter md:text-4xl lg:text-5xl'>
            Help Center
          </h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed md:text-lg'>
            Everything you need to know to become an Expense Pro power user.
          </p>
        </div>
      </header>

      <div className='bg-background/95 sticky top-16 z-40 border-b shadow-sm backdrop-blur-md md:hidden'>
        <div className='px-4 py-3'>
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant='outline' className='flex w-full items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Icon name='menu' className='h-4 w-4' />
                  <span className='truncate text-sm font-medium'>
                    {currentSection?.title || 'Navigation'}
                  </span>
                </div>
                <Icon name='chevronDown' className='text-muted-foreground h-4 w-4' />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-full max-w-xs p-4'>
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
          <aside className='hidden lg:col-span-1 lg:block'>
            <div className='sticky top-24 space-y-4'>
              <Card className='shadow-sm'>
                <CardContent className='p-6'>
                  <TableOfContents />
                </CardContent>
              </Card>
            </div>
          </aside>

          <main className='lg:col-span-3'>
            <Card className='shadow-lg'>
              <CardContent className='p-6 md:p-8 lg:p-10'>
                <Suspense
                  fallback={
                    <div className='flex min-h-[50vh] items-center justify-center'>
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
                        className={cn('scroll-mt-24', index > 0 && 'mt-16 border-t pt-12')}
                      >
                        <MdxComponent />
                      </section>
                    );
                  })}
                </Suspense>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
