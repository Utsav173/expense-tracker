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

  const buttonClasses = `
    relative z-10 h-12 w-12 rounded-full border border-primary/40
    flex items-center justify-center 
    bg-gradient-to-br from-primary/10 via-background/80 to-primary/5
    backdrop-blur-md shadow-xl
    will-change-transform
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.15
      }}
    >
      {/* Subtle glow effect */}
      <motion.div
        className='bg-primary/10 absolute inset-0 -z-10 rounded-full blur-md'
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'loop'
        }}
      />

      {/* Floating animation wrapper */}
      <motion.div
        animate={{
          y: [0, -4, 0]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'loop'
        }}
      >
        {/* Subtle pulse ring */}
        <motion.div
          className='border-primary/20 absolute inset-0 rounded-full border'
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeOut',
            repeatType: 'loop'
          }}
        />

        <Sheet>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SheetTrigger asChild>
                  <motion.button
                    whileHover={{
                      scale: 1.08,
                      boxShadow: '0 8px 25px rgba(var(--primary-rgb, 59 130 246), 0.3)',
                      transition: {
                        type: 'spring',
                        stiffness: 400,
                        damping: 15
                      }
                    }}
                    whileTap={{
                      scale: 0.96,
                      transition: { duration: 0.1 }
                    }}
                    className={cn(buttonClasses)}
                    aria-label={'AI Assistant'}
                  >
                    {/* Icon with subtle animation */}
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        repeatType: 'loop'
                      }}
                      className='relative z-10 h-7 w-7'
                    >
                      {/* Try icon-gradient first, fallback to img */}
                      <span
                        className='icon-gradient text-primary block h-full w-full'
                        style={
                          {
                            '--mask-url': `url(${iconUrl})`,
                            maskImage: `url(${iconUrl})`,
                            WebkitMaskImage: `url(${iconUrl})`,
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center',
                            backgroundColor: 'currentColor',
                            filter: 'drop-shadow(0 1px 3px rgba(var(--primary), 0.3))'
                          } as React.CSSProperties
                        }
                      />
                      {/* Fallback img if mask doesn't work */}
                      <img
                        src={iconUrl}
                        alt='AI'
                        className='text-primary-foreground absolute inset-0 h-full w-full opacity-0 dark:opacity-100'
                        style={{
                          filter:
                            'brightness(0) saturate(100%) invert(58%) sepia(14%) saturate(3166%) hue-rotate(215deg) brightness(91%) contrast(87%)'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.previousElementSibling?.setAttribute(
                            'style',
                            'display: none'
                          );
                        }}
                      />
                    </motion.div>
                  </motion.button>
                </SheetTrigger>
              </TooltipTrigger>
              <TooltipContent side='left' sideOffset={12}>
                <p className='font-medium'>AI Financial Assistant</p>
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
    </motion.div>
  );
};
