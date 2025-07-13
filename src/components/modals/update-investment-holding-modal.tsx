'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { NumericInput } from '../ui/numeric-input';
import DatePicker from '../date/date-picker';
import { Investment, StockPriceResult } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardHeader, CardDescription } from '@/components/ui/card';
import {
  Loader2,
  TrendingUp,
  Calendar,
  Layers,
  BarChart4,
  PiggyBank,
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  TrendingDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '../ui/skeleton';
import { useInvestmentHoldingForm } from '@/hooks/use-investment-holding-form';
import { investmentUpdate, investmentUpdateDividend } from '@/lib/endpoints/investment';

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
  investment: Investment;
  accountCurrency: string;
  onInvestmentUpdated: () => void;
  getStockPriceFn?: (symbol: string) => Promise<StockPriceResult | null>;
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

  const {
    detailsForm,
    dividendForm,
    isHistoricalPriceLoading,
    currentPriceInfo,
    isPriceLoading
  } = useInvestmentHoldingForm({
    investment,
    onInvestmentUpdated,
    getStockPriceFn,
    isOpen
  });

  const handleDetailsUpdate = (id: string, data: z.infer<typeof investmentHoldingUpdateSchema>) => {
    const apiPayload = {
      ...data,
      purchaseDate: data.purchaseDate.toISOString()
    };
    return investmentUpdate(id, apiPayload);
  };

  const handleDividendUpdate = (id: string, data: z.infer<typeof dividendUpdateSchema>) => {
    return investmentUpdateDividend(id, { dividend: parseFloat(data.dividend) });
  };

  return (
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
        <UpdateModal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          title={`Edit Investment: ${investment.symbol}`}
          description="Update the purchase details for this investment."
          initialValues={detailsForm.getValues()}
          validationSchema={investmentHoldingUpdateSchema}
          updateFn={handleDetailsUpdate}
          invalidateKeys={[
            ['investments', investment.account],
            ['investmentAccountSummary', investment.account],
            ['investmentPortfolioSummaryDashboard'],
            ['dashboardData']
          ]}
          onSuccess={onInvestmentUpdated}
          entityId={investment.id}
        >
          {(form) => (
            <>
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
                control={form.control}
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
                        disabled={form.formState.isSubmitting || isHistoricalPriceLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
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
                          disabled={form.formState.isSubmitting}
                          decimalScale={8}
                          ref={field.ref as React.Ref<HTMLInputElement>}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                          disabled={form.formState.isSubmitting || isHistoricalPriceLoading}
                          suffix={` ${accountCurrency}`}
                          ref={field.ref as React.Ref<HTMLInputElement>}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
        </UpdateModal>
      </TabsContent>

      <TabsContent value='dividends'>
        <UpdateModal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          title={`Edit Dividend: ${investment.symbol}`}
          description="Update the dividend information for this investment."
          initialValues={dividendForm.getValues()}
          validationSchema={dividendUpdateSchema}
          updateFn={handleDividendUpdate}
          invalidateKeys={[
            ['investments', investment.account],
            ['investmentAccountSummary', investment.account],
            ['investmentPortfolioSummaryDashboard'],
            ['dashboardData']
          ]}
          onSuccess={onInvestmentUpdated}
          entityId={investment.id}
        >
          {(form) => (
            <FormField
              control={form.control}
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
                      disabled={form.formState.isSubmitting}
                      suffix={` ${accountCurrency}`}
                      ref={field.ref as React.Ref<HTMLInputElement>}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </UpdateModal>
      </TabsContent>
    </Tabs>
  );
};

export default UpdateInvestmentHoldingModal;
