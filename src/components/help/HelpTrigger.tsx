'use client';

import React, { useState } from 'react';
import { ContextualHelpSidebar } from './ContextualHelpSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Icon } from '../ui/icon';

export const HelpTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const buttonClasses = `
    relative z-10 h-11 w-11 rounded-full border flex items-center justify-center 
    bg-background/80 backdrop-blur-md shadow-lg
    will-change-transform
  `;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
          mass: 0.8,
          delay: 0.1
        }}
      >
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatType: 'loop'
          }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    transition: {
                      type: 'spring',
                      stiffness: 400,
                      damping: 15
                    }
                  }}
                  whileTap={{
                    scale: 0.98,
                    transition: { duration: 0.1 }
                  }}
                  aria-label='Open contextual help'
                  onClick={() => setIsOpen(true)}
                  className={cn(buttonClasses)}
                  layout
                >
                  <motion.div
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      repeatType: 'loop'
                    }}
                  >
                    <Icon name='help' className='text-primary h-6 w-6' />
                  </motion.div>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side='left' sideOffset={10}>
                <p className='font-medium'>Contextual Help</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      </motion.div>

      <ContextualHelpSidebar isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
