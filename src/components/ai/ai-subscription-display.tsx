'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icon } from '../ui/icon';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../providers/auth-provider';
import startCase from 'lodash/startCase';

type Subscription = {
  merchant: string;
  frequency: string;
  averageAmount: number;
  transactionCount: number;
  lastPaymentDate: string;
};

interface AiSubscriptionDisplayProps {
  subscriptions: Subscription[];
}

const AiSubscriptionDisplay: React.FC<AiSubscriptionDisplayProps> = ({ subscriptions }) => {
  const { session } = useAuth();
  const user = session?.user;
  const currency = user?.preferredCurrency || 'INR';

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card className='mt-4'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icon name='search' className='h-5 w-5' />
            Subscription Hunter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            No potential subscriptions found in the last 12 months.
          </p>
        </CardContent>
      </Card>
    );
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
          <CardTitle className='flex items-center gap-2'>
            <Icon name='search' className='h-5 w-5' />
            Subscription Hunter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-4 text-sm'>
            Found {subscriptions.length} potential recurring subscriptions from the last 12 months.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead className='text-right'>Avg. Amount</TableHead>
                <TableHead className='text-right'>Last Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub, index) => (
                <TableRow key={index}>
                  <TableCell className='font-medium'>{sub.merchant}</TableCell>
                  <TableCell>{startCase(sub.frequency)}</TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(sub.averageAmount, currency)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {format(parseISO(sub.lastPaymentDate), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AiSubscriptionDisplay;
