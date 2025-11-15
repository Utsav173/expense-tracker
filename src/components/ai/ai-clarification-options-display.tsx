'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icon } from '../ui/icon';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { useChat } from '@ai-sdk/react';
import { useToast } from '@/lib/hooks/useToast';
import NoData from '../ui/no-data';

interface AiClarificationOptionsDisplayProps {
  options: Array<{
    id: string;
    name?: string;
    description?: string;
    currency?: string;
    details?: string;
    balance?: number;
  }>;
  message: string;
}

const AiClarificationOptionsDisplay: React.FC<AiClarificationOptionsDisplayProps> = React.memo(
  ({ options, message }) => {
    const { sendMessage } = useChat();
    const { showSuccess } = useToast();

    const handleOptionClick = (optionId: string, optionDetails?: string) => {
      sendMessage({
        text: `I choose option: ${optionId}${optionDetails ? ` (${optionDetails})` : ''}`
      });
      showSuccess(`Selected: ${optionDetails || optionId}`);
    };

    if (!options || options.length === 0) {
      return (
        <Card>
          <CardContent className='p-4'>
            <NoData message='No clarification options available.' icon='helpCircle' />
          </CardContent>
        </Card>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full space-y-3'
      >
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Icon name='helpCircle' className='h-5 w-5 text-blue-500' />
              Clarification Needed
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground text-sm'>{message}</p>
            <div className='grid gap-2'>
              {options.map((option) => (
                <Button
                  key={option.id}
                  variant='outline'
                  className='h-auto justify-start p-3 text-left'
                  onClick={() => handleOptionClick(option.id, option.details || option.name)}
                >
                  <Icon name='checkCircle' className='text-muted-foreground mr-2 h-4 w-4' />
                  <span className='flex-1'>
                    {option.details || option.name || `Option ID: ${option.id}`}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

export default AiClarificationOptionsDisplay;
