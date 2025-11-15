'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/ui/icon';
import { PromptSuggestion } from './prompt-suggestion';

interface SuggestionGroupProps {
  title?: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const SuggestionGroup: React.FC<SuggestionGroupProps> = ({
  title,
  icon,
  suggestions,
  onSuggestionClick
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className='w-full'>
      {!!title ? (
        <h4 className='text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold'>
          <Icon name={icon} className='h-4 w-4' />
          {title}
        </h4>
      ) : null}
      <div className='space-y-2'>
        {suggestions.map((s, i) => (
          <motion.div
            key={s}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.3,
              delay: prefersReducedMotion ? 0 : 0.2 + i * 0.1,
              ease: 'easeOut'
            }}
          >
            <PromptSuggestion text={s} onClick={() => onSuggestionClick(s)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
