'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { helpSections } from '@/content/help';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    const elements = allIds.map((id) => document.getElementById(id)).filter(Boolean);
    elements.forEach((el) => observer.observe(el!));
    return () => elements.forEach((el) => observer.unobserve(el!));
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120; // Increased offset to account for fixed header
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
      {helpSections.map((item) => {
        const isActive =
          activeId === item.id || item.subsections?.some((sub) => sub.id === activeId);

        return (
          <div key={item.id} className='relative'>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
                )}
              >
                <Icon name={item.icon} className='h-4 w-4' aria-hidden='true' />
              </div>
              <span className='flex-1 truncate font-medium'>{item.title}</span>

              {isActive && (
                <motion.div
                  layoutId='active-pill'
                  className='bg-primary absolute inset-y-0 left-0 w-1 rounded-r-full'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </a>

            {/* Subsections - Only show when active or expanded */}
            {isActive && item.subsections && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className='border-border/50 mt-1 ml-11 space-y-1 border-l pl-2'
              >
                {item.subsections.map((sub) => (
                  <a
                    key={sub.id}
                    href={`#${sub.id}`}
                    onClick={(e) => handleLinkClick(e, sub.id)}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                      activeId === sub.id
                        ? 'bg-primary/5 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    )}
                  >
                    {sub.title}
                  </a>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className='sticky top-16 z-40 md:hidden'>
        <div className='bg-background/80 border-border/50 absolute inset-0 border-b backdrop-blur-xl' />
        <div className='relative px-4 py-3'>
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant='outline'
                className='bg-background/50 border-border/50 w-full justify-between shadow-sm backdrop-blur-sm'
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
            <SheetContent side='left' className='w-full max-w-xs p-0'>
              <div className='flex h-full flex-col'>
                <SheetHeader className='border-border/50 border-b p-6'>
                  <SheetTitle className='flex items-center gap-2 text-left text-lg font-bold'>
                    <Icon name='lifeBuoy' className='text-primary h-5 w-5' />
                    Help Center
                  </SheetTitle>
                </SheetHeader>
                <div className='flex-1 overflow-y-auto p-4'>
                  <TableOfContents />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className='hidden lg:col-span-3 lg:block'>
        <div className='sticky top-24'>
          <div className='border-border/50 bg-card/30 rounded-2xl border p-4 shadow-sm backdrop-blur-xl'>
            <div className='mb-6 flex items-center gap-2 px-2'>
              <div className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg'>
                <Icon name='bookOpen' className='h-4 w-4' />
              </div>
              <h2 className='text-muted-foreground text-sm font-bold tracking-wider uppercase'>
                Contents
              </h2>
            </div>
            <TableOfContents />
          </div>
        </div>
      </aside>
    </>
  );
}
