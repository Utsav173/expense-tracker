'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icon } from '../ui/icon';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AiCreatedEntitySummaryDisplayProps {
  entity: {
    type: string;
    name: string;
    id: string;
    details?: string;
  };
}

const AiCreatedEntitySummaryDisplay: React.FC<AiCreatedEntitySummaryDisplayProps> = ({
  entity
}) => {
  if (!entity) {
    return null;
  }

  let iconName: React.ComponentProps<typeof Icon>['name'] = 'checkCircle';
  let iconClass = 'text-green-500';

  switch (entity.type.toLowerCase()) {
    case 'account':
      iconName = 'wallet';
      iconClass = 'text-blue-500';
      break;
    case 'budget':
      iconName = 'piggyBank';
      iconClass = 'text-purple-500';
      break;
    case 'goal':
      iconName = 'target';
      iconClass = 'text-yellow-500';
      break;
    case 'category':
      iconName = 'tag';
      iconClass = 'text-indigo-500';
      break;
    case 'transaction':
      iconName = 'receipt';
      iconClass = 'text-teal-500';
      break;
    case 'investment':
      iconName = 'trendingUp';
      iconClass = 'text-green-500';
      break;
    case 'debt':
      iconName = 'handshake';
      iconClass = 'text-red-500';
      break;
    default:
      iconName = 'checkCircle';
      iconClass = 'text-green-500';
      break;
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
            <Icon name={iconName} className={cn('h-5 w-5', iconClass)} />
            {entity.type} Created/Updated
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <p className='text-sm font-medium'>Name: {entity.name}</p>
          {entity.details && <p className='text-muted-foreground text-sm'>{entity.details}</p>}
          <p className='text-muted-foreground text-xs'>ID: {entity.id}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AiCreatedEntitySummaryDisplay;
