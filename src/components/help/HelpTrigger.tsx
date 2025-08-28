'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ContextualHelpSidebar } from './ContextualHelpSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

export const HelpTrigger = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            >
              <Button
                variant='default'
                size='icon'
                className='h-12 w-12 rounded-full shadow-lg'
                onClick={() => setIsOpen(true)}
                aria-label='Open contextual help'
              >
                <Icon name='lifeBuoy' className='h-6 w-6' />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side='left' sideOffset={10}>
            <p>Help for this page</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ContextualHelpSidebar isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
