'use client';

import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AiChat } from './ai-chat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/components/providers/auth-provider';
import { iconMap } from '../ui/icon-map';

export const AiChatTrigger = () => {
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const user = session?.user;

  if (!user?.hasAiApiKey) {
    return null;
  }

  const iconString = iconMap.ai;
  const iconUrlPath = iconString.replace(':', '/');
  const iconUrl = `https://api.iconify.design/${iconUrlPath}.svg`;

  // CHANGED: Button size reduced from h-14 w-14 to h-11 w-11
  const buttonClasses =
    'relative z-10 h-11 w-11 rounded-full border flex items-center justify-center bg-background/80 backdrop-blur-md shadow-lg transition-transform duration-300 hover:scale-110 animate-pulse-glow';

  return (
    <motion.div
      initial={{ scale: 0, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Sheet>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1, transition: { type: 'spring', stiffness: 300 } }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(buttonClasses)}
                  aria-label={'AI Assistant'}
                >
                  <span
                    // CHANGED: Icon size reduced from h-8 w-8 to h-6 w-6 for better proportion
                    className='icon-gradient h-6 w-6'
                    style={
                      {
                        '--mask-url': `url(${iconUrl})`
                      } as React.CSSProperties
                    }
                  />
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
            isMobile ? 'h-[90dvh] w-full rounded-t-xl' : 'h-full max-w-[55%] min-w-[40%]'
          )}
          aria-describedby={undefined}
        >
          <AiChat isFullPage />
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};
