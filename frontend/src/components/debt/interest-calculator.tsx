'use client';

import { ApiResponse } from '@/lib/types';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { interestSchema, type InterestFormSchema } from '@/lib/utils/schema.validations';
import { useMutation } from '@tanstack/react-query';
import { interestCreate } from '@/lib/endpoints/debt';
import { useToast } from '@/lib/hooks/useToast';

interface InterestResponse {
  interest: number;
  totalAmount: number;
}

const InterestCalculator = () => {
  const [result, setResult] = useState<{ interest: number; totalAmount: number } | null>(null);
  const { showError } = useToast();

  const form = useForm<InterestFormSchema>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      debt: '',
      amount: '',
      type: 'simple',
      percentage: '',
      frequency: '',
      duration: 'year'
    }
  });

  const calculateInterestMutation = useMutation<
    ApiResponse<InterestResponse>,
    Error,
    InterestFormSchema
  >({
    mutationFn: (data: InterestFormSchema) => interestCreate(data),
    onSuccess: (data) => {
      if (data) {
        setResult({ interest: data.interest, totalAmount: data.totalAmount });
      }
    },
    onError: (error) => {
      showError(error.message);
      setResult(null);
    }
  });

  const handleCalculate = (data: InterestFormSchema) => {
    calculateInterestMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interest Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleCalculate)} className='space-y-4'>
          <div>
            <label htmlFor='amount' className='block text-sm font-medium text-gray-700'>
              Principal Amount
            </label>
            <Input
              type='text'
              placeholder='Enter amount'
              {...form.register('amount')}
              className='mt-1 w-full'
            />
            {form.formState.errors.amount && (
              <p className='mt-1 text-sm text-red-500'>{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor='percentage' className='block text-sm font-medium text-gray-700'>
              Interest Rate (%)
            </label>
            <Input
              type='text'
              placeholder='Enter interest rate'
              {...form.register('percentage')}
              className='mt-1 w-full'
            />
            {form.formState.errors.percentage && (
              <p className='mt-1 text-sm text-red-500'>
                {form.formState.errors.percentage.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor='type' className='block text-sm font-medium text-gray-700'>
              Interest Type
            </label>
            <Select
              onValueChange={(value) => form.setValue('type', value as 'simple' | 'compound')}
              value={form.watch('type')}
            >
              <SelectTrigger className='mt-1 w-full'>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='simple'>Simple</SelectItem>
                <SelectItem value='compound'>Compound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.watch('type') === 'compound' && (
            <div>
              <label htmlFor='frequency' className='block text-sm font-medium text-gray-700'>
                Compounding Frequency (Yearly)
              </label>
              <Input
                type='number'
                placeholder='Enter compounding frequency'
                {...form.register('frequency')}
                className='mt-1 w-full'
              />
              {form.formState.errors.frequency && (
                <p className='mt-1 text-sm text-red-500'>
                  {form.formState.errors.frequency.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor='duration' className='block text-sm font-medium text-gray-700'>
              Duration
            </label>
            <Select
              onValueChange={(value) =>
                form.setValue('duration', value as 'day' | 'week' | 'month' | 'year')
              }
              value={form.watch('duration')}
            >
              <SelectTrigger className='mt-1 w-full'>
                <SelectValue placeholder='Select duration' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='day'>Day</SelectItem>
                <SelectItem value='week'>Week</SelectItem>
                <SelectItem value='month'>Month</SelectItem>
                <SelectItem value='year'>Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type='submit' disabled={calculateInterestMutation.isPending}>
            {calculateInterestMutation.isPending ? 'Calculating...' : 'Calculate Interest'}
          </Button>
        </form>

        {result && (
          <div className='mt-4'>
            <p>
              <strong>Interest:</strong> {result.interest.toFixed(2)}
            </p>
            <p>
              <strong>Total Amount:</strong> {result.totalAmount.toFixed(2)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterestCalculator;
