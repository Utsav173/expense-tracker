'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { helpSections } from '@/content/help';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import Loader from '@/components/ui/loader';
import { useIsMobile } from '@/hooks/use-mobile';

const GettingStarted = React.lazy(() => import('@/content/help/getting-started.mdx'));
const Dashboard = React.lazy(() => import('@/content/help/dashboard.mdx'));
const Transactions = React.lazy(() => import('@/content/help/transactions.mdx'));
const Accounts = React.lazy(() => import('@/content/help/accounts.mdx'));
const Planning = React.lazy(() => import('@/content/help/planning.mdx'));
const AiAssistant = React.lazy(() => import('@/content/help/ai-assistant.mdx'));
const DataManagement = React.lazy(() => import('@/content/help/data-management.mdx'));
const ProfileSettings = React.lazy(() => import('@/content/help/profile-settings.mdx'));

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 }
    );

    const elements = allIds.map((id) => document.getElementById(id)).filter(Boolean);
    elements.forEach((el) => observer.observe(el!));

    return () => elements.forEach((el) => observer.unobserve(el!));
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = isMobile ? -60 : -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.pushState(null, '', `#${id}`);
      setActiveId(id);
      // Close mobile menu after navigation
      setIsMobileMenuOpen(false);
    }
  };

  const isSubActive = (subsections?: TocItem[]) => {
    return subsections?.some((sub) => sub.id === activeId);
  };

  const currentSection = helpSections.find(section => 
    section.id === activeId || section.subsections?.some(sub => sub.id === activeId)
  );

  const TableOfContents = () => (
    <div className="space-y-1">
      <h3 className='text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase'>
        TABLE OF CONTENTS
      </h3>
      <ul className='space-y-1'>
        {helpSections.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg p-3 text-sm font-medium transition-all duration-200',
                (activeId === item.id && !isSubActive(item.subsections)) ||
                  isSubActive(item.subsections)
                  ? 'bg-primary/15 text-primary shadow-sm border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:shadow-sm'
              )}
            >
              <div className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                (activeId === item.id && !isSubActive(item.subsections)) ||
                  isSubActive(item.subsections)
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
              )} />
              {item.title}
            </a>
            {item.subsections && (isSubActive(item.subsections) || !isMobile) && (
              <ul className='mt-2 ml-6 space-y-1'>
                {item.subsections.map((sub) => (
                  <li key={sub.id}>
                    <a
                      href={`#${sub.id}`}
                      onClick={(e) => handleLinkClick(e, sub.id)}
                      className={cn(
                        'block rounded-md p-2 pl-4 text-xs font-medium transition-all duration-200 border-l-2',
                        activeId === sub.id
                          ? 'text-primary font-semibold border-primary bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground border-transparent hover:border-muted-foreground/30'
                      )}
                    >
                      {sub.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className='bg-background min-h-screen'>
      {/* Header */}
      <header className='relative py-12 md:py-16 px-4 text-center bg-gradient-to-br from-primary/5 via-background to-secondary/5'>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-secondary/[0.02]" />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 mb-6 shadow-lg">
            <Icon name='lifeBuoy' className='text-primary h-10 w-10 md:h-12 md:w-12' />
          </div>
          <h1 className='text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tighter mb-4'>
            Help Center
          </h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-base md:text-lg leading-relaxed'>
            Everything you need to know to become an Expense Pro power user.
          </p>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b shadow-sm">
          <div className="px-4 py-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-card border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium text-sm truncate">
                  {currentSection?.title || 'Navigation'}
                </span>
              </div>
              <Icon 
                name={isMobileMenuOpen ? 'chevronUp' : 'chevronDown'} 
                className="w-4 h-4 text-muted-foreground" 
              />
            </button>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-background/98 backdrop-blur-md border-b shadow-lg max-h-[70vh] overflow-y-auto">
              <div className="p-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <TableOfContents />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      <div className='container mx-auto max-w-7xl px-4 py-8'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          {/* Desktop Sidebar */}
          <aside className='hidden lg:block lg:col-span-1'>
            <div className="sticky top-24 space-y-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className='p-6'>
                  <TableOfContents />
                </CardContent>
              </Card>
              
              {/* Progress Indicator */}
              <Card className="shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Reading: {currentSection?.title}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className='lg:col-span-3'>
            <Card className='shadow-lg hover:shadow-xl transition-shadow duration-300'>
              <CardContent className='p-6 md:p-8 lg:p-10'>
                <Suspense
                  fallback={
                    <div className='flex min-h-[50vh] items-center justify-center'>
                      <div className="space-y-4 text-center">
                        <Loader />
                        <p className="text-sm text-muted-foreground">Loading content...</p>
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
                          'scroll-mt-20 md:scroll-mt-24',
                          index > 0 && 'mt-16 pt-8 border-t'
                        )}
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

      {/* Mobile FAB for quick navigation */}
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <Icon name="menu" className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}