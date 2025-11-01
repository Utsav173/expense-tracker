'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { helpSections } from '@/content/help';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export default function HelpNavigation() {
  const [activeId, setActiveId] = useState('getting-started');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

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
      window.scrollTo({ top: y, behavior: 'auto' });
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
    <div className='space-y-0.5'>
      {helpSections.map((item) => (
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
              <div className='bg-primary ml-auto h-2 w-2 rounded-full' />
            )}
          </a>
        </div>
      ))}
    </div>
  );

  return (
    <>
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
        </div>
      </aside>
    </>
  );
}
