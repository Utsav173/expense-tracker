'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { investmentUpdate, investmentUpdateDividend } from '@/lib/endpoints/investment';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Investment } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  Loader2,
  TrendingUp,
  Calendar,
  Layers,
  BarChart4,
  PiggyBank,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NumericFormat } from 'react-number-format';
import {
  investmentHoldingUpdateSchema,
  dividendUpdateSchema
} from '@/lib/utils/schema.validations';
import { z } from 'zod';
import DateTimePicker from '../date/date-time-picker';

type InvestmentHoldingUpdateFormSchema = z.infer<typeof investmentHoldingUpdateSchema>;
type DividendUpdateFormSchema = z.infer<typeof dividendUpdateSchema>;

interface UpdateInvestmentHoldingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment;
  accountCurrency: string;
  onInvestmentUpdated: () => void;
}

// --- Helper Functions (Moved outside) ---
const calculateChange = (current: string | undefined, original: number | undefined | null) => {
  if (original === null || original === undefined || !current || isNaN(parseFloat(current))) {
    return null;
  }
  const currentNum = parseFloat(current);
  const diff = currentNum - original;
  const percentage = original !== 0 ? (diff / original) * 100 : currentNum > 0 ? Infinity : 0; // Handle division by zero

  return {
    diff,
    percentage: isFinite(percentage) ? percentage : 100 * Math.sign(diff), // Handle Infinity for percentage
    isPositive: diff >= 0
  };
};

const calculateYield = (dividendStr: string | undefined, totalValue: number | null) => {
  const dividendNum = parseFloat(dividendStr || '0');
  if (totalValue && !isNaN(dividendNum) && totalValue > 0) {
    return (dividendNum / totalValue) * 100;
  }
  return null;
};
// --- End Helper Functions ---

const UpdateInvestmentHoldingModal: React.FC<UpdateInvestmentHoldingModalProps> = ({
  isOpen,
  onOpenChange,
  investment,
  accountCurrency,
  onInvestmentUpdated
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();
  const [activeTab, setActiveTab] = useState('details');
  const [totalValue, setTotalValue] = useState<number | null>(null);

  const detailsForm = useForm<InvestmentHoldingUpdateFormSchema>({
    resolver: zodResolver(investmentHoldingUpdateSchema),
    defaultValues: {
      shares: String(investment.shares || ''),
      purchasePrice: String(investment.purchasePrice || ''),
      purchaseDate: investment.purchaseDate ? new Date(investment.purchaseDate) : new Date()
    },
    mode: 'onChange' // Use onChange for immediate feedback on validation
  });

  const dividendForm = useForm<DividendUpdateFormSchema>({
    resolver: zodResolver(dividendUpdateSchema),
    defaultValues: {
      dividend: String(investment.dividend || '0')
    },
    mode: 'onChange' // Use onChange for immediate feedback on validation
  });

  const shares = detailsForm.watch('shares');
  const purchasePrice = detailsForm.watch('purchasePrice');
  const dividend = dividendForm.watch('dividend');

  // Calculate total investment value whenever shares or price changes
  useEffect(() => {
    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(purchasePrice);
    setTotalValue(!isNaN(sharesNum) && !isNaN(priceNum) ? sharesNum * priceNum : null);
  }, [shares, purchasePrice]);

  useEffect(() => {
    if (isOpen) {
      detailsForm.reset({
        shares: String(investment.shares || ''),
        purchasePrice: String(investment.purchasePrice || ''),
        purchaseDate: investment.purchaseDate ? new Date(investment.purchaseDate) : new Date()
      });
      dividendForm.reset({
        dividend: String(investment.dividend || '0')
      });
      setActiveTab('details');
    }
  }, [isOpen, investment, detailsForm, dividendForm]);

  // --- Mutations ---
  const updateInvestmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => investmentUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['investments', investment.account]);
      await invalidate(['investmentAccountSummary', investment.account]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      showSuccess('Investment details updated successfully!');
      onInvestmentUpdated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const updateDividendMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { dividend: number } }) =>
      investmentUpdateDividend(id, data),
    onSuccess: async () => {
      await invalidate(['investments', investment.account]);
      await invalidate(['investmentAccountSummary', investment.account]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      showSuccess('Dividend updated successfully!');
      onInvestmentUpdated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });
  // --- End Mutations ---

  const handleDetailsUpdate = (data: InvestmentHoldingUpdateFormSchema) => {
    updateInvestmentMutation.mutate({
      id: investment.id,
      data: {
        shares: Number(data.shares),
        purchasePrice: Number(data.purchasePrice),
        purchaseDate: data.purchaseDate.toISOString()
      }
    });
  };

  const handleDividendUpdate = (data: DividendUpdateFormSchema) => {
    updateDividendMutation.mutate({
      id: investment.id,
      data: {
        dividend: Number(data.dividend)
      }
    });
  };

  const isPending = updateInvestmentMutation.isPending || updateDividendMutation.isPending;

  // --- Memoized Calculations ---
  const sharesChange = useMemo(
    () => calculateChange(shares, investment.shares),
    [shares, investment.shares]
  );
  const priceChange = useMemo(
    () => calculateChange(purchasePrice, investment.purchasePrice),
    [purchasePrice, investment.purchasePrice]
  );
  const dividendChange = useMemo(
    () => calculateChange(dividend, investment.dividend),
    [dividend, investment.dividend]
  );
  const dividendYield = useMemo(() => calculateYield(dividend, totalValue), [dividend, totalValue]);
  // --- End Memoized Calculations ---

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px] md:max-w-[600px] [&>button:last-child]:hidden'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <TrendingUp className='text-primary h-5 w-5' />
              Edit Investment
            </DialogTitle>
            <Badge variant='outline' className='ml-2'>
              {investment.symbol}
            </Badge>
          </div>
          <DialogDescription className='pt-1.5'>
            Update the investment details and dividend information for {investment.symbol}.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='mt-2'>
          <TabsList className='mb-2 grid w-full grid-cols-2'>
            <TabsTrigger value='details' className='flex items-center gap-1.5'>
              <BarChart4 className='h-4 w-4' />
              <span>Investment Details</span>
            </TabsTrigger>
            <TabsTrigger value='dividends' className='flex items-center gap-1.5'>
              <PiggyBank className='h-4 w-4' />
              <span>Dividend Info</span>
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value='details' className='pt-2'>
            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(handleDetailsUpdate)} className='space-y-5'>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <FormField
                      control={detailsForm.control}
                      name='shares'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5'>
                            <Layers className='text-muted-foreground h-4 w-4' />
                            Number of Shares
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <NumericFormat
                                customInput={Input}
                                thousandSeparator=','
                                decimalSeparator='.'
                                allowNegative={false}
                                placeholder='e.g., 10.5'
                                onValueChange={(values) => field.onChange(values.value)}
                                value={field.value}
                              />
                              {sharesChange && (
                                <div className='absolute top-1/2 right-3 -translate-y-1/2 transform'>
                                  <Badge
                                    variant={sharesChange.isPositive ? 'default' : 'destructive'}
                                    className='px-1.5 text-xs'
                                  >
                                    {sharesChange.isPositive ? (
                                      <ArrowUp className='mr-0.5 h-3 w-3' />
                                    ) : (
                                      <ArrowDown className='mr-0.5 h-3 w-3' />
                                    )}
                                    {Math.abs(sharesChange.percentage).toFixed(1)}%
                                  </Badge>
                                </div>
                              )}
                            </div>
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
                            Purchase Price
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <NumericFormat
                                customInput={Input}
                                thousandSeparator=','
                                decimalSeparator='.'
                                allowNegative={false}
                                decimalScale={2}
                                placeholder='e.g., 150.75'
                                className='pl-10'
                                onValueChange={(values) => field.onChange(values.value)}
                                value={field.value}
                              />
                              <span className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 transform text-sm'>
                                {accountCurrency}
                              </span>
                              {priceChange && (
                                <div className='absolute top-1/2 right-3 -translate-y-1/2 transform'>
                                  <Badge
                                    variant={priceChange.isPositive ? 'default' : 'destructive'}
                                    className='px-1.5 text-xs'
                                  >
                                    {priceChange.isPositive ? (
                                      <ArrowUp className='mr-0.5 h-3 w-3' />
                                    ) : (
                                      <ArrowDown className='mr-0.5 h-3 w-3' />
                                    )}
                                    {Math.abs(priceChange.percentage).toFixed(1)}%
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={detailsForm.control}
                    name='purchaseDate'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel className='flex items-center gap-1.5'>
                          <Calendar className='text-muted-foreground h-4 w-4' />
                          Purchase Date
                        </FormLabel>
                        <FormControl>
                          <DateTimePicker value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {totalValue !== null && (
                  <Card className='border-primary/20 bg-muted/30 border p-4'>
                    <h3 className='mb-2 flex items-center gap-2 text-sm font-medium'>
                      <AlertCircle className='text-primary h-4 w-4' />
                      Updated Investment Summary
                    </h3>
                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      <div className='text-muted-foreground'>Total Value:</div>
                      <div className='text-right font-medium'>
                        {formatCurrency(totalValue, accountCurrency)}
                      </div>
                      {shares && !isNaN(parseFloat(shares)) && (
                        <>
                          <div className='text-muted-foreground'>Number of Shares:</div>
                          <div className='text-right font-medium'>
                            {parseFloat(shares).toLocaleString()}
                          </div>
                        </>
                      )}
                      {purchasePrice && !isNaN(parseFloat(purchasePrice)) && (
                        <>
                          <div className='text-muted-foreground'>Price per Share:</div>
                          <div className='text-right font-medium'>
                            {formatCurrency(parseFloat(purchasePrice), accountCurrency)}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                <Separator />

                <DialogFooter className='flex flex-col gap-2 pt-2 sm:flex-row sm:gap-0'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                    className='order-2 w-full sm:order-1 sm:w-auto'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isPending}
                    className='order-1 w-full sm:order-2 sm:w-auto'
                  >
                    {updateInvestmentMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className='mr-2 h-4 w-4' />
                        Update Details
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Dividends Tab */}
          <TabsContent value='dividends' className='pt-2'>
            <Form {...dividendForm}>
              <form
                onSubmit={dividendForm.handleSubmit(handleDividendUpdate)}
                className='space-y-5'
              >
                <div className='space-y-4'>
                  <FormField
                    control={dividendForm.control}
                    name='dividend'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1.5'>
                          <PiggyBank className='text-muted-foreground h-4 w-4' />
                          Total Dividend Received
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <NumericFormat
                              customInput={Input}
                              thousandSeparator=','
                              decimalSeparator='.'
                              allowNegative={false}
                              decimalScale={2}
                              placeholder='e.g., 25.50'
                              className='pl-10'
                              onValueChange={(values) => field.onChange(values.value)}
                              value={field.value}
                            />
                            <span className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 transform text-sm'>
                              {accountCurrency}
                            </span>
                            {dividendChange && (
                              <div className='absolute top-1/2 right-3 -translate-y-1/2 transform'>
                                <Badge
                                  variant={dividendChange.isPositive ? 'default' : 'destructive'}
                                  className='px-1.5 text-xs'
                                >
                                  {dividendChange.isPositive ? (
                                    <ArrowUp className='mr-0.5 h-3 w-3' />
                                  ) : (
                                    <ArrowDown className='mr-0.5 h-3 w-3' />
                                  )}
                                  {Math.abs(dividendChange.percentage).toFixed(1)}%
                                </Badge>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {dividend && !isNaN(parseFloat(dividend)) && totalValue !== null && (
                  <Card className='border-primary/20 bg-muted/30 border p-4'>
                    <h3 className='mb-2 flex items-center gap-2 text-sm font-medium'>
                      <PiggyBank className='text-primary h-4 w-4' />
                      Dividend Summary
                    </h3>
                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      <div className='text-muted-foreground'>Total Dividend:</div>
                      <div className='text-right font-medium'>
                        {formatCurrency(parseFloat(dividend), accountCurrency)}
                      </div>
                      {dividendYield !== null && (
                        <>
                          <div className='text-muted-foreground'>Dividend Yield:</div>
                          <div className='text-right font-medium'>{dividendYield.toFixed(2)}%</div>
                        </>
                      )}
                      {totalValue > 0 && (
                        <>
                          <div className='text-muted-foreground'>Investment Value:</div>
                          <div className='text-right font-medium'>
                            {formatCurrency(totalValue, accountCurrency)}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                <Separator />

                <DialogFooter className='flex flex-col gap-2 pt-2 sm:flex-row sm:gap-0'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                    className='order-2 w-full sm:order-1 sm:w-auto'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isPending}
                    className='order-1 w-full sm:order-2 sm:w-auto'
                  >
                    {updateDividendMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className='mr-2 h-4 w-4' />
                        Update Dividend
                      </>
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
