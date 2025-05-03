'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BrainCircuit } from 'lucide-react';
import { AiChat } from './ai-chat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const AiChatTrigger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant='default'
                size='icon'
                className={cn(
                  'fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg',
                  'transition-transform duration-200 ease-out hover:scale-110 focus-visible:scale-110 active:scale-95',
                  'from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 bg-gradient-to-br'
                )}
                aria-label='Open AI Assistant'
              >
                <BrainCircuit className='h-6 w-6' />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side='left' sideOffset={10}>
            <p>AI Financial Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col p-0 [&>button:first-of-type]:hidden',
          isMobile
            ? 'h-[90dvh] w-full rounded-t-xl'
            : 'h-full w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl'
        )}
        aria-describedby={undefined}
      >
        {/* SheetHeader might not be needed if AiChat handles its own title */}
        {/* <SheetHeader className="sr-only"> <SheetTitle>AI Assistant</SheetTitle> </SheetHeader> */}

        {/* Pass handleClose only if not mobile for the header X */}
        <AiChat handleClose={!isMobile ? () => setIsOpen(false) : undefined} />

        {/* Optional: Add an explicit close button inside SheetContent if needed for mobile?
            The AiChat header already has one, so maybe not necessary. */}
        {/* {isMobile && (
           <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setIsOpen(false)}>
               <X className="h-4 w-4" />
           </Button>
        )} */}
      </SheetContent>
    </Sheet>
  );
};
