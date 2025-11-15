'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icon } from '../ui/icon';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

interface AiIpoLinkDisplayProps {
  url: string;
}

const AiIpoLinkDisplay: React.FC<AiIpoLinkDisplayProps> = ({ url }) => {
  if (!url) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='mt-4 w-full space-y-4'
    >
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icon name='externalLink' className='h-5 w-5 text-blue-500' />
            Upcoming IPOs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-3 text-sm'>
            You can find the list of upcoming IPOs at the following link:
          </p>
          <Button asChild>
            <a href={url} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2'>
              View Upcoming IPOs
              <Icon name='arrowRight' className='h-4 w-4' />
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AiIpoLinkDisplay;
