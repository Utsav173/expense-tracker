'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import startCase from 'lodash/startCase';

interface AiMetricsDisplayProps {
  metrics: Record<string, any>;
}

const AiMetricsDisplay: React.FC<AiMetricsDisplayProps> = ({ metrics }) => {
  const { user } = useAuth();
  const currency = user?.preferredCurrency || 'INR';

  if (!metrics || Object.keys(metrics).length === 0) {
    return null;
  }

  return (
    <Card className='bg-muted/50 mt-2'>
      <CardHeader className='p-3 pb-2'>
        <CardTitle className='text-sm font-semibold'>Key Metrics</CardTitle>
      </CardHeader>
      <CardContent className='p-3 pt-0'>
        <div className='space-y-2'>
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className='flex justify-between border-t pt-2 text-sm'>
              <span className='text-muted-foreground'>{startCase(key)}</span>
              <span className='font-semibold'>
                {typeof value === 'number' ? formatCurrency(value, currency) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AiMetricsDisplay;
