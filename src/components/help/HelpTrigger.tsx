'use client';

import React, { useState } from 'react';
import { ContextualHelpSidebar } from './ContextualHelpSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Icon } from '../ui/icon';

export const HelpTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const buttonClasses =
    'relative z-10 h-11 w-11 rounded-full border flex items-center justify-center bg-background/80 backdrop-blur-md shadow-lg transition-transform duration-300 hover:scale-110 animate-pulse-glow';

  return (
    <>
      <motion.div
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1, transition: { type: 'spring', stiffness: 300 } }}
                whileTap={{ scale: 0.95 }}
                aria-label='Open contextual help'
                onClick={() => setIsOpen(true)}
                className={cn(buttonClasses)}
              >
                <Icon name='help' className='text-primary h-6 w-6' />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side='left' sideOffset={10}>
              <p className='font-medium'>Contextual Help</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      <ContextualHelpSidebar isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
