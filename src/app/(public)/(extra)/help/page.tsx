'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { helpSections } from '@/content/help';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import Loader from '@/components/ui/loader';

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
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.pushState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  const isSubActive = (subsections?: TocItem[]) => {
    return subsections?.some((sub) => sub.id === activeId);
  };

  return (
    <div className='bg-background min-h-screen py-16 md:py-24'>
      <div className='container mx-auto max-w-7xl px-4'>
        <header className='mb-12 text-center'>
          <Icon name='lifeBuoy' className='text-primary mx-auto mb-4 h-16 w-16' />
          <h1 className='text-4xl font-extrabold tracking-tighter sm:text-5xl'>Help Center</h1>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-lg'>
            Everything you need to know to become an Expense Pro power user.
          </p>
        </header>

        <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
          <aside className='sticky top-24 h-fit md:col-span-1'>
            <Card>
              <CardContent className='p-4'>
                <h3 className='text-muted-foreground mb-2 text-sm font-semibold tracking-wider uppercase'>
                  TABLE OF CONTENTS
                </h3>
                <ul className='space-y-1'>
                  {helpSections.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => handleLinkClick(e, item.id)}
                        className={cn(
                          'block rounded-md p-2 text-sm font-medium transition-colors',
                          (activeId === item.id && !isSubActive(item.subsections)) ||
                            isSubActive(item.subsections)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        {item.title}
                      </a>
                      {item.subsections && (
                        <ul className='mt-1 ml-4 space-y-1 border-l pl-2'>
                          {item.subsections.map((sub) => (
                            <li key={sub.id}>
                              <a
                                href={`#${sub.id}`}
                                onClick={(e) => handleLinkClick(e, sub.id)}
                                className={cn(
                                  'block rounded-md p-2 text-xs font-medium transition-colors',
                                  activeId === sub.id
                                    ? 'text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
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
              </CardContent>
            </Card>
          </aside>

          <main className='md:col-span-3'>
            <Card className='shadow-lg'>
              <CardContent className='p-6 sm:p-8 md:p-10'>
                <Suspense
                  fallback={
                    <div className='flex min-h-[50vh] items-center justify-center'>
                      <Loader />
                    </div>
                  }
                >
                  {helpSections.map((section) => {
                    const MdxComponent = mdxComponents[section.id];
                    if (!MdxComponent) return null;
                    return (
                      <section key={section.id} id={section.id} className='mb-12'>
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
