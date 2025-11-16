'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

interface AiConfirmationDisplayProps {
  confirmation: {
    id: string;
    details: string;
    message: string;
  };
  onConfirm?: (id: string) => void;
  onCancel?: () => void;
}

export default function AiConfirmationDisplay({
  confirmation,
  onConfirm,
  onCancel
}: AiConfirmationDisplayProps) {
  return (
    <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950'>
      <div className='mb-3 flex items-start gap-2'>
        <Icon name='alertTriangle' className='mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400' />
        <div className='flex-1'>
          <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
            {confirmation.message}
          </p>
          <p className='mt-1 text-sm text-amber-700 dark:text-amber-300'>{confirmation.details}</p>
        </div>
      </div>
      <div className='flex gap-2'>
        <Button
          size='sm'
          variant='default'
          onClick={() => onConfirm?.(confirmation.id)}
          className='bg-amber-600 hover:bg-amber-700'
        >
          <Icon name='check' className='mr-1 h-4 w-4' />
          Confirm
        </Button>
        <Button size='sm' variant='outline' onClick={onCancel}>
          <Icon name='x' className='mr-1 h-4 w-4' />
          Cancel
        </Button>
      </div>
    </div>
  );
}
