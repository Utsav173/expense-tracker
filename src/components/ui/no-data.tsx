'use client';

import React from 'react';
import { FileQuestion, Inbox, XCircle, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconMapKeys = 'file-question' | 'inbox' | 'x-circle';

const iconMap: Record<IconMapKeys, React.ElementType<LucideProps>> = {
  'file-question': FileQuestion,
  inbox: Inbox,
  'x-circle': XCircle
};

interface NoDataProps {
  message?: string;
  description?: string;
  className?: string;
  icon?: IconMapKeys | 'none' | React.ElementType<LucideProps>;
  action?: React.ReactNode;
}

const NoData: React.FC<NoDataProps> = ({
  message = 'No data found.',
  description,
  className,
  icon = 'inbox',
  action
}) => {
  let IconComponent: React.ElementType<LucideProps> | null = null;
  if (typeof icon === 'string') {
    if (icon !== 'none') {
      IconComponent = iconMap[icon as IconMapKeys];
    }
  } else {
    IconComponent = icon;
  }

  return (
    <div
      className={cn(
        'border-border flex h-full min-h-[250px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center',
        className
      )}
    >
      {IconComponent && (
        <div className='bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
          <IconComponent className='text-muted-foreground h-8 w-8' />
        </div>
      )}
      <h3 className='text-lg font-semibold'>{message}</h3>
      {description && <p className='text-muted-foreground mt-1 max-w-sm text-sm'>{description}</p>}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
};

export default NoData;
