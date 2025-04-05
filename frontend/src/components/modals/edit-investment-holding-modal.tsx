'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import DateTimePicker from '../date-time-picker';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Investment } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  Loader2,
  TrendingUp,
  Calendar,
  DollarSign,
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

const investmentHoldingUpdateSchema = z.object({
  shares: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Shares must be a positive number'
  }),
  purchasePrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Purchase price must be a non-negative number'
  }),
  purchaseDate: z.date({ required_error: 'Purchase date is required.' })
});

const dividendUpdateSchema = z.object({
  dividend: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Dividend must be a non-negative number'
  })
});

type InvestmentHoldingUpdateFormSchema = z.infer<typeof investmentHoldingUpdateSchema>;
type DividendUpdateFormSchema = z.infer<typeof dividendUpdateSchema>;

interface EditInvestmentHoldingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment;
  accountCurrency: string;
  onInvestmentUpdated: () => void;
}

const EditInvestmentHoldingModal: React.FC<EditInvestmentHoldingModalProps> = ({
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
    mode: 'onSubmit'
  });

  const dividendForm = useForm<DividendUpdateFormSchema>({
    resolver: zodResolver(dividendUpdateSchema),
    defaultValues: {
      dividend: String(investment.dividend || '0')
    },
    mode: 'onSubmit'
  });

  const shares = detailsForm.watch('shares');
  const purchasePrice = detailsForm.watch('purchasePrice');
  const dividend = dividendForm.watch('dividend');

  // Calculate total investment value whenever shares or price changes
  useEffect(() => {
    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(purchasePrice);

    if (!isNaN(sharesNum) && !isNaN(priceNum)) {
      setTotalValue(sharesNum * priceNum);
    } else {
      setTotalValue(null);
    }
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

  // Calculate changes from original values
  const calculateChange = (current: string, original: number | undefined) => {
    if (!original || !current || isNaN(parseFloat(current))) return null;

    const currentNum = parseFloat(current);
    const diff = currentNum - original;
    const percentage = original !== 0 ? (diff / original) * 100 : 0;

    return {
      diff,
      percentage,
      isPositive: diff >= 0
    };
  };

  const sharesChange = calculateChange(shares, investment.shares);
  const priceChange = calculateChange(purchasePrice, investment.purchasePrice);
  const dividendChange = calculateChange(dividend, investment.dividend);

  // Calculate yield if we have both dividend and total value
  const calculateYield = () => {
    const dividendNum = parseFloat(dividend);

    if (totalValue && !isNaN(dividendNum) && totalValue > 0) {
      return (dividendNum / totalValue) * 100;
    }
    return null;
  };

  const dividendYield = calculateYield();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px] md:max-w-[600px] [&>button:last-child]:hidden'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <TrendingUp className='h-5 w-5 text-primary' />
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
                            <Layers className='h-4 w-4 text-muted-foreground' />
                            Number of Shares
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                type='number'
                                step='any'
                                placeholder='e.g., 10.5'
                                className='pl-3'
                                {...field}
                              />
                              {sharesChange && (
                                <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
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
                            <DollarSign className='h-4 w-4 text-muted-foreground' />
                            Purchase Price
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                type='number'
                                step='0.01'
                                placeholder='e.g., 150.75'
                                className='pl-3'
                                {...field}
                              />
                              {priceChange && (
                                <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
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
                          <Calendar className='h-4 w-4 text-muted-foreground' />
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
                  <Card className='border border-primary/20 bg-muted/30 p-4'>
                    <h3 className='mb-2 flex items-center gap-2 text-sm font-medium'>
                      <AlertCircle className='h-4 w-4 text-primary' />
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
                          <PiggyBank className='h-4 w-4 text-muted-foreground' />
                          Total Dividend Received
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <DollarSign className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground' />
                            <Input
                              type='number'
                              step='0.01'
                              placeholder='e.g., 25.50'
                              className='pl-10'
                              {...field}
                            />
                            {dividendChange && (
                              <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
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

                {/* Dividend Summary Card */}
                {dividend && !isNaN(parseFloat(dividend)) && totalValue !== null && (
                  <Card className='border border-primary/20 bg-muted/30 p-4'>
                    <h3 className='mb-2 flex items-center gap-2 text-sm font-medium'>
                      <PiggyBank className='h-4 w-4 text-primary' />
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

export default EditInvestmentHoldingModal;
