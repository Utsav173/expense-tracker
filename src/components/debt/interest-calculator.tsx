'use client';

import type { DebtAndInterestAPI } from '@/lib/api/api-types';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '../ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { interestCalculate } from '@/lib/endpoints/debt';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';
import { NumericInput } from '../ui/numeric-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '../ui/input';
import { formatCurrency } from '@/lib/utils';
import { Loader2, ArrowRight } from 'lucide-react';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';

type InterestFormSchema = z.infer<typeof apiEndpoints.interest.calculate.body>;

interface InterestCalculatorProps {
  onUseCalculation?: (data: InterestFormSchema) => void;
}

const InterestCalculator: React.FC<InterestCalculatorProps> = ({ onUseCalculation }) => {
  const [result, setResult] = useState<{ interest: number; totalAmount: number } | null>(null);
  const { showError } = useToast();

  const form = useForm<InterestFormSchema>({
    resolver: zodResolver(apiEndpoints.interest.calculate.body),
    defaultValues: {
      amount: 0,
      interestType: 'simple',
      interestRate: 0,
      termLength: 1,
      termUnit: 'years',
      compoundingFrequency: 12
    },
    mode: 'onChange'
  });

  const calculateInterestMutation = useMutation<
    DebtAndInterestAPI.CalculateInterestResponse,
    Error,
    InterestFormSchema
  >({
    mutationFn: (data: InterestFormSchema) => interestCalculate(data),
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
    <Card className='border-none shadow-none'>
      <CardContent className='p-0'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCalculate)} className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount</FormLabel>
                    <FormControl>
                      <NumericInput
                        placeholder='Enter amount'
                        onValueChange={({ value }: { value: string }) =>
                          field.onChange(Number(value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='interestRate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (% p.a.)</FormLabel>
                    <FormControl>
                      <NumericInput
                        placeholder='Enter interest rate'
                        onValueChange={({ value }: { value: string }) =>
                          field.onChange(Number(value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='termLength'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Length</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='e.g., 2'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='termUnit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select unit' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='days'>Days</SelectItem>
                        <SelectItem value='weeks'>Weeks</SelectItem>
                        <SelectItem value='months'>Months</SelectItem>
                        <SelectItem value='years'>Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='interestType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='simple'>Simple</SelectItem>
                        <SelectItem value='compound'>Compound</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('interestType') === 'compound' && (
                <FormField
                  control={form.control}
                  name='compoundingFrequency'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compounds per Year</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='e.g., 12 for monthly'
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button type='submit' disabled={calculateInterestMutation.isPending} className='w-full'>
              {calculateInterestMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              {calculateInterestMutation.isPending ? 'Calculating...' : 'Calculate Interest'}
            </Button>
          </form>
        </Form>

        {result && (
          <div className='bg-muted/50 mt-6 space-y-3 rounded-lg border p-4'>
            <h3 className='text-lg font-semibold'>Calculation Result</h3>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Total Interest:</span>
              <span className='text-primary font-bold'>{formatCurrency(result.interest)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Total Amount Payable:</span>
              <span className='text-foreground font-bold'>
                {formatCurrency(result.totalAmount)}
              </span>
            </div>
            {onUseCalculation && (
              <Button
                variant='link'
                className='h-auto p-0 text-sm'
                onClick={() => onUseCalculation(form.getValues())}
              >
                Create Debt from this Calculation <ArrowRight className='ml-1 h-4 w-4' />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterestCalculator;
