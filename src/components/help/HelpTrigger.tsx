'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ContextualHelpSidebar } from './ContextualHelpSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const HelpTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className='ai-trigger-entrance inline-block rounded-full p-[2px]'
              style={{
                background:
                  'radial-gradient(60% 50% at 20% 10%, rgba(255,255,255,0.06), transparent 12%), linear-gradient(180deg,#ffffff08,#0000000a)'
              }}
            >
              <Button
                size='icon'
                variant='ghost'
                aria-label='Open contextual help'
                onClick={() => setIsOpen(true)}
                className='focus-visible:ring-primary/40 relative h-12 w-12 overflow-hidden rounded-full border border-white/6 bg-[var(--help-bg)] shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.03] focus-visible:ring-2 active:scale-95'
              >
                {/* Decorative inner ring */}
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-0 rounded-full'
                  style={{
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -6px 18px rgba(0,0,0,0.35)'
                  }}
                />

                {/* subtle rotating accent (CSS-only) */}
                <span
                  aria-hidden
                  className='animate-rotate-slow help-decor absolute inset-0 rounded-full'
                  style={{ opacity: 0.06 }}
                />

                {/* Icon with subtle gradient fill */}
                <Icon name='lifeBuoy' className='relative z-10 h-6 w-6' />
              </Button>
            </div>
          </TooltipTrigger>

          <TooltipContent side='left' sideOffset={10}>
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>Contextual Help</p>
              <p className='text-muted-foreground text-xs'>Quick tips and guides for this page</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ContextualHelpSidebar isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
