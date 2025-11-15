'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import startCase from 'lodash/startCase';
import NoData from '../ui/no-data';

interface AiMetricsDisplayProps {
  metrics: Record<string, any>;
}

const AiMetricsDisplay: React.FC<AiMetricsDisplayProps> = ({ metrics }) => {
  const { session } = useAuth();
  const user = session?.user;
  const currency = user?.preferredCurrency || 'INR';

  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <Card className='bg-muted/50'>
        <CardContent className='p-4'>
          <NoData message='No metrics available for this query.' icon='barChart3' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-muted/50'>
      <CardHeader className='p-3 pb-2'>
        <CardTitle className='text-sm font-semibold'>Key Metrics</CardTitle>
      </CardHeader>
      <CardContent className='p-3 pt-0'>
        <div className='space-y-2'>
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className='flex justify-between gap-2 border-t pt-2 text-sm'>
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
