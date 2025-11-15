'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/icon';

export const PromptSuggestion = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <motion.button
    whileHover={{ x: 2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 600, damping: 15 }}
    onClick={onClick}
    className='group bg-background hover:bg-muted flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all hover:shadow-sm'
  >
    <Icon
      name='sparkles'
      className='text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-colors'
    />
    <span className='flex-1 text-purple-800 dark:text-indigo-300' title={text}>
      {text}
    </span>
    <Icon
      name='arrowRight'
      className='text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100'
    />
  </motion.button>
);
