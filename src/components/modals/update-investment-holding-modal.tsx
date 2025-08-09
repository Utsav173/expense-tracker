'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { NumericInput } from '../ui/numeric-input';
import DatePicker from '../date/date-picker';
import type { InvestmentAPI } from '@/lib/api/api-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardDescription } from '@/components/ui/card';
import { Loader2, Calendar, Layers, BarChart4, PiggyBank, Pencil } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useInvestmentHoldingForm } from '@/hooks/use-investment-holding-form';
import { investmentUpdate, investmentUpdateDividend } from '@/lib/endpoints/investment';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const investmentHoldingUpdateSchema = z.object({
  shares: z
    .string()
    .min(1, 'Shares field is required.')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Shares must be a positive number.'
    }),
  purchasePrice: z
    .string()
    .min(1, 'Purchase price is required.')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Purchase price must be a non-negative number.'
    }),
  purchaseDate: z.date({ required_error: 'Purchase date is required.' })
});

const dividendUpdateSchema = z.object({
  dividend: z
    .string()
    .min(1, 'Dividend field is required.')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Dividend must be a non-negative number.'
    })
});

interface UpdateInvestmentHoldingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  investment: InvestmentAPI.Investment;
  accountCurrency: string;
  onInvestmentUpdated: () => void;
  getStockPriceFn?: (symbol: string) => Promise<InvestmentAPI.StockPriceResult | null>;
}

const UpdateInvestmentHoldingModal: React.FC<UpdateInvestmentHoldingModalProps> = ({
  isOpen,
  onOpenChange,
  investment,
  accountCurrency,
  onInvestmentUpdated,
  getStockPriceFn
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const { showError, showSuccess } = useToast();
  const invalidate = useInvalidateQueries();

  const { detailsForm, dividendForm, isHistoricalPriceLoading, currentPriceInfo, isPriceLoading } =
    useInvestmentHoldingForm({
      investment,
      onInvestmentUpdated,
      getStockPriceFn,
      isOpen
    });

  const invalidateKeys = [
    ['investments', investment.account],
    ['investmentAccountSummary', investment.account],
    ['investmentPortfolioSummaryDashboard'],
    ['dashboardData']
  ];

  const detailsMutation = useMutation({
    mutationFn: (data: z.infer<typeof investmentHoldingUpdateSchema>) => {
      const apiPayload = {
        shares: parseFloat(data.shares),
        purchasePrice: parseFloat(data.purchasePrice),
        purchaseDate: data.purchaseDate.toISOString()
      };
      return investmentUpdate(investment.id, apiPayload);
    },
    onSuccess: async () => {
      for (const key of invalidateKeys) {
        await invalidate(key);
      }
      showSuccess('Investment details updated successfully.');
      onInvestmentUpdated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to update investment details.';
      showError(message);
    }
  });

  const dividendMutation = useMutation({
    mutationFn: (data: z.infer<typeof dividendUpdateSchema>) => {
      return investmentUpdateDividend(investment.id, { dividend: parseFloat(data.dividend) });
    },
    onSuccess: async () => {
      for (const key of invalidateKeys) {
        await invalidate(key);
      }
      showSuccess('Dividend information updated successfully.');
      onInvestmentUpdated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to update dividend information.';
      showError(message);
    }
  });

  const handleDetailsSubmit = (values: z.infer<typeof investmentHoldingUpdateSchema>) => {
    detailsMutation.mutate(values);
  };

  const handleDividendSubmit = (values: z.infer<typeof dividendUpdateSchema>) => {
    dividendMutation.mutate(values);
  };

  const handleClose = () => {
    if (!detailsMutation.isPending && !dividendMutation.isPending) {
      onOpenChange(false);
    }
  };

  const isLoading = detailsMutation.isPending || dividendMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil className='h-5 w-5' />
            Edit Investment: {investment.symbol}
          </DialogTitle>
          <DialogDescription>
            Update the investment details or dividend information.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='mt-2'>
          <TabsList className='mb-2 grid w-full grid-cols-2'>
            <TabsTrigger value='details' className='flex items-center gap-1.5'>
              <BarChart4 className='h-4 w-4' />
              <span>Purchase Details</span>
            </TabsTrigger>
            <TabsTrigger value='dividends' className='flex items-center gap-1.5'>
              <PiggyBank className='h-4 w-4' />
              <span>Dividend Info</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='details'>
            <Form {...detailsForm}>
              <form
                onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)}
                className='space-y-6 pt-2'
              >
                {investment?.symbol && getStockPriceFn && (
                  <Card className='border-border/50 bg-muted/30'>
                    <CardHeader className='flex flex-row items-center justify-between p-3'>
                      <div className='space-y-0.5'>
                        <CardDescription className='text-xs'>Current Market Info</CardDescription>
                        <div className='text-lg font-bold'>
                          {isPriceLoading ? (
                            <Skeleton className='h-6 w-24' />
                          ) : currentPriceInfo?.price !== null &&
                            currentPriceInfo?.price !== undefined ? (
                            formatCurrency(
                              currentPriceInfo.price,
                              currentPriceInfo.currency ?? accountCurrency
                            )
                          ) : (
                            <span className='text-muted-foreground text-sm'>N/A</span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )}

                <FormField
                  control={detailsForm.control}
                  name='purchaseDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel className='flex items-center gap-1.5'>
                        <Calendar className='text-muted-foreground h-4 w-4' />
                        Purchase Date*
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isLoading || isHistoricalPriceLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <FormField
                    control={detailsForm.control}
                    name='shares'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1.5'>
                          <Layers className='text-muted-foreground h-4 w-4' />
                          Number of Shares*
                        </FormLabel>
                        <FormControl>
                          <NumericInput
                            placeholder='e.g., 10.5'
                            value={field.value}
                            onValueChange={(values: any) => field.onChange(values.value)}
                            disabled={isLoading}
                            decimalScale={8}
                            ref={field.ref as React.Ref<HTMLInputElement>}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={detailsForm.control}
                    name='purchasePrice'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1.5'>
                          Purchase Price / Share*{' '}
                          {isHistoricalPriceLoading && (
                            <Loader2 className='text-primary h-3 w-3 animate-spin' />
                          )}
                        </FormLabel>
                        <FormControl>
                          <NumericInput
                            placeholder='e.g., 150.75'
                            className='pr-10'
                            value={field.value}
                            onValueChange={(values: any) => field.onChange(values.value)}
                            disabled={isLoading || isHistoricalPriceLoading}
                            suffix={` ${accountCurrency}`}
                            ref={field.ref as React.Ref<HTMLInputElement>}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className='gap-2 pt-4 sm:gap-0'>
                  <DialogClose asChild>
                    <Button type='button' variant='outline' disabled={isLoading}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type='submit'
                    disabled={
                      isLoading || !detailsForm.formState.isValid || !detailsForm.formState.isDirty
                    }
                    className='min-w-[120px]'
                  >
                    {detailsMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value='dividends'>
            <Form {...dividendForm}>
              <form
                onSubmit={dividendForm.handleSubmit(handleDividendSubmit)}
                className='space-y-6 pt-2'
              >
                <FormField
                  control={dividendForm.control}
                  name='dividend'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-1.5'>
                        <PiggyBank className='text-muted-foreground h-4 w-4' />
                        Total Dividend Received*
                      </FormLabel>
                      <FormControl>
                        <NumericInput
                          placeholder='e.g., 25.50'
                          className='pr-10'
                          value={field.value}
                          onValueChange={(values: any) => field.onChange(values.value)}
                          disabled={isLoading}
                          suffix={` ${accountCurrency}`}
                          ref={field.ref as React.Ref<HTMLInputElement>}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className='gap-2 pt-4 sm:gap-0'>
                  <DialogClose asChild>
                    <Button type='button' variant='outline' disabled={isLoading}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type='submit'
                    disabled={
                      isLoading ||
                      !dividendForm.formState.isValid ||
                      !dividendForm.formState.isDirty
                    }
                    className='min-w-[120px]'
                  >
                    {dividendMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateInvestmentHoldingModal;
