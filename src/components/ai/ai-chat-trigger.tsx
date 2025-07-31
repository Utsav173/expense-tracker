'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BrainCircuit, X } from 'lucide-react';
import { AiChat } from './ai-chat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/components/providers/auth-provider';

export const AiChatTrigger = () => {
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const user = session?.user;

  if (!user?.hasAiApiKey) {
    return null;
  }

  const buttonClasses =
    'fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full shadow-lg flex items-center justify-center from-primary to-accent bg-gradient-to-br text-primary-foreground';

  const iconVariants = {
    initial: { opacity: 0, scale: 0.5, rotate: -90 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0.5, rotate: 90 }
  };

  return (
    <Sheet>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
                whileHover={{ scale: 1.1, transition: { type: 'spring', stiffness: 300 } }}
                whileTap={{ scale: 0.95 }}
                className={cn(buttonClasses)}
                aria-label={'AI Assistant'}
              >
                {/* Pulsing ring for attention */}
                <span className='bg-primary absolute h-full w-full animate-ping rounded-full opacity-20' />

                {/* Icon transition */}
                <AnimatePresence mode='wait' initial={false}>
                  <motion.div
                    key='ai'
                    variants={iconVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                  >
                    <BrainCircuit className='h-6 w-6' />
                  </motion.div>
                </AnimatePresence>
              </motion.button>
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
          isMobile ? 'h-[90dvh] w-full rounded-t-xl' : 'h-full max-w-2xl min-w-[30%]'
        )}
        aria-describedby={undefined}
      >
        <AiChat isFullPage />
      </SheetContent>
    </Sheet>
  );
};
