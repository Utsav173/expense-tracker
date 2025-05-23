'use client';

import React from 'react';
import { FileQuestion, Inbox, XCircle } from 'lucide-react';

interface NoDataProps {
  message?: string;
  className?: string;
  icon?: 'file-question' | 'inbox' | 'x-circle' | 'none' | React.ComponentType;
}

const NoData: React.FC<NoDataProps> = ({
  message = 'No data found.',
  className,
  icon = 'file-question'
}) => {
  let IconComponent: React.ComponentType<{ className?: string }> | null =
    typeof icon === 'function' ? icon : null;

  switch (icon) {
    case 'file-question':
      IconComponent = FileQuestion;
      break;
    case 'inbox':
      IconComponent = Inbox;
      break;
    case 'x-circle':
      IconComponent = XCircle;
      break;
    case 'none':
      IconComponent = null;
      break;
  }

  return (
    <div
      className={`text-muted-foreground flex min-h-full flex-col items-center justify-center p-4 ${
        className || ''
      }`}
    >
      {IconComponent && <IconComponent className='text-muted-foreground mb-4 h-16 w-16' />}
      <p className='text-center text-sm'>{message}</p>
    </div>
  );
};

export default NoData;
