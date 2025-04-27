'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  investmentUpdate,
  investmentUpdateDividend,
  investmentStockHistoricalPrice,
  investmentStockPrice
} from '@/lib/endpoints/investment';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Investment, StockPriceResult, StockSearchResult } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
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
import { NumericInput } from '../ui/numeric-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import DatePicker from '../date/date-picker';
import { Skeleton } from '../ui/skeleton';
import {
  format as formatDate,
  isValid as isDateValid,
  isWeekend,
  subDays,
  isFuture,
  startOfDay,
  isSameDay,
  parseISO
} from 'date-fns';
import { Combobox, ComboboxOption } from '../ui/combobox';
import { NumberFormatValues } from 'react-number-format';

// --- Helper Functions ---
const calculateChange = (currentStr: string | undefined, original: number | undefined | null) => {
  const currentNum = currentStr !== undefined ? parseFloat(currentStr) : NaN; // Parse string here
  if (original === null || original === undefined || isNaN(currentNum)) {
    return null;
  }
  const diff = currentNum - original;
  if (original === 0) {
    const percentage = currentNum > 0 ? Infinity : currentNum < 0 ? -Infinity : 0;
    return { diff, percentage, isPositive: diff >= 0 };
  }
  const percentage = (diff / original) * 100;
  return {
    diff,
    percentage: isFinite(percentage) ? percentage : 100 * Math.sign(diff),
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

const getMostRecentValidDate = (initialDate: Date = new Date()): Date => {
  let candidateDate = startOfDay(new Date(initialDate));
  const todayStart = startOfDay(new Date());

  if (isFuture(candidateDate)) {
    candidateDate = todayStart;
  }

  while (isWeekend(candidateDate)) {
    candidateDate = subDays(candidateDate, 1);
  }
  return candidateDate;
};
// --- End Helper Functions ---

// --- Zod Schemas ---
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
// --- End Zod Schemas ---

// --- Type Definitions ---
type InvestmentHoldingUpdateFormValues = {
  shares: string;
  purchasePrice: string;
  purchaseDate: Date;
};
type DividendUpdateFormValues = { dividend: string };

// API payloads expect numbers and ISO string for date
type InvestmentUpdateApiPayload = {
  shares: number;
  purchasePrice: number;
  purchaseDate: string; // ISO String
};
type DividendUpdateApiPayload = { dividend: number };
// --- End Type Definitions ---

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
  const { showSuccess, showError, showInfo } = useToast();
  const invalidate = useInvalidateQueries();
  const [activeTab, setActiveTab] = useState('details');
  const [isHistoricalPriceLoading, setIsHistoricalPriceLoading] = useState(false);

  const detailsForm = useForm<InvestmentHoldingUpdateFormValues>({
    resolver: zodResolver(investmentHoldingUpdateSchema),
    mode: 'onChange',
    // Default values use strings for numeric inputs
    defaultValues: {
      shares:
        investment?.shares !== undefined && investment?.shares !== null
          ? String(investment.shares)
          : '',
      purchasePrice:
        investment?.purchasePrice !== undefined && investment?.purchasePrice !== null
          ? String(investment.purchasePrice)
          : '',
      purchaseDate: investment?.purchaseDate
        ? parseISO(investment.purchaseDate)
        : getMostRecentValidDate()
    }
  });

  const dividendForm = useForm<DividendUpdateFormValues>({
    resolver: zodResolver(dividendUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      dividend:
        investment?.dividend !== undefined && investment?.dividend !== null
          ? String(investment.dividend)
          : '0'
    }
  });
  // Watched Values
  const purchaseDate = detailsForm.watch('purchaseDate');
  const sharesStr = detailsForm.watch('shares');
  const purchasePriceStr = detailsForm.watch('purchasePrice');
  const dividendStr = dividendForm.watch('dividend');

  const formattedPurchaseDate = useMemo(() => {
    return purchaseDate && isDateValid(purchaseDate)
      ? formatDate(purchaseDate, 'yyyy-MM-dd')
      : null;
  }, [purchaseDate]);

  const canFetchHistorical = useMemo(() => {
    const dateToCheck = purchaseDate instanceof Date ? purchaseDate : null;
    return (
      !!investment?.symbol &&
      !!dateToCheck &&
      isDateValid(dateToCheck) &&
      !isWeekend(dateToCheck) &&
      !isFuture(startOfDay(dateToCheck))
    );
  }, [investment?.symbol, purchaseDate]);

  // --- Current Price Fetching (Optional) ---
  const { data: currentPriceInfo, isLoading: isPriceLoading } = useQuery({
    queryKey: ['stockPrice', investment?.symbol],
    queryFn: async () => {
      if (!investment?.symbol || !getStockPriceFn) return null;
      return getStockPriceFn(investment.symbol);
    },
    enabled: !!investment?.symbol && !!getStockPriceFn && isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true
  });

  // --- Historical Price Fetching ---
  const { isLoading: isHistQueryLoading, data: historicalPriceData } = useQuery({
    queryKey: ['historicalStockPrice', investment?.symbol, formattedPurchaseDate],
    queryFn: async () => {
      if (!investment?.symbol || !formattedPurchaseDate) return null;
      setIsHistoricalPriceLoading(true);
      try {
        const data = await investmentStockHistoricalPrice(investment.symbol, formattedPurchaseDate);
        return data;
      } finally {
        setIsHistoricalPriceLoading(false);
      }
    },
    enabled: canFetchHistorical && isOpen,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1
  });

  // --- Effect to update form with fetched historical price ---
  useEffect(() => {
    if (
      canFetchHistorical &&
      !isHistoricalPriceLoading &&
      historicalPriceData?.price !== null &&
      historicalPriceData?.price !== undefined
    ) {
      const fetchedPriceString = historicalPriceData.price.toString();
      const currentPurchasePriceValue = detailsForm.getValues('purchasePrice');
      const currentDateInForm = detailsForm.getValues('purchaseDate');

      if (
        currentDateInForm &&
        isDateValid(currentDateInForm) &&
        formatDate(currentDateInForm, 'yyyy-MM-dd') === formattedPurchaseDate
      ) {
        if (fetchedPriceString !== currentPurchasePriceValue) {
          detailsForm.setValue('purchasePrice', fetchedPriceString, {
            shouldValidate: true,
            shouldDirty: true
          });
          showInfo(`Auto-filled price for ${investment?.symbol} on ${formattedPurchaseDate}.`);
        }
      }
    } else if (canFetchHistorical && !isHistoricalPriceLoading && historicalPriceData) {
      showError(
        `Could not auto-fetch price for ${investment?.symbol} on ${formattedPurchaseDate}. Enter manually.`
      );
    }
  }, [
    historicalPriceData,
    isHistoricalPriceLoading,
    canFetchHistorical,
    detailsForm,
    investment?.symbol,
    formattedPurchaseDate,
    showInfo,
    showError
  ]);

  // --- Form Reset ---
  useEffect(() => {
    if (isOpen && investment) {
      detailsForm.reset({
        shares: String(investment.shares || ''),
        purchasePrice: String(investment.purchasePrice || ''),
        purchaseDate: investment.purchaseDate
          ? parseISO(investment.purchaseDate)
          : getMostRecentValidDate()
      });
      dividendForm.reset({
        dividend: String(investment.dividend || '0')
      });
      setActiveTab('details');
    }
  }, [isOpen, investment, detailsForm, dividendForm]);

  // --- Memoized Calculations ---
  const totalValue = useMemo(() => {
    const sharesNum = parseFloat(sharesStr);
    const priceNum = parseFloat(purchasePriceStr);
    return !isNaN(sharesNum) && !isNaN(priceNum) ? sharesNum * priceNum : null;
  }, [sharesStr, purchasePriceStr]);

  const sharesChange = useMemo(
    () => calculateChange(sharesStr, investment?.shares),
    [sharesStr, investment?.shares]
  );
  const priceChange = useMemo(
    () => calculateChange(purchasePriceStr, investment?.purchasePrice),
    [purchasePriceStr, investment?.purchasePrice]
  );
  const dividendChange = useMemo(
    () => calculateChange(dividendStr, investment?.dividend),
    [dividendStr, investment?.dividend]
  );
  const dividendYield = useMemo(
    () => calculateYield(dividendStr, totalValue),
    [dividendStr, totalValue]
  );

  // --- Price Comparison ---
  const priceComparison = useMemo(() => {
    const currentPrice = currentPriceInfo?.price;
    if (
      currentPrice !== null &&
      currentPrice !== undefined &&
      purchasePriceStr &&
      !isNaN(parseFloat(purchasePriceStr))
    ) {
      const purchasePriceNum = parseFloat(purchasePriceStr);
      if (purchasePriceNum === 0) return null;
      const diff = currentPrice - purchasePriceNum;
      const percentage = (diff / purchasePriceNum) * 100;
      return {
        diff,
        percentage: isFinite(percentage) ? percentage : 100 * Math.sign(diff),
        isPositive: diff >= 0
      };
    }
    return null;
  }, [currentPriceInfo?.price, purchasePriceStr]);

  // --- Mutations ---
  const updateInvestmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvestmentUpdateApiPayload }) =>
      investmentUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['investments', investment.account]);
      await invalidate(['investmentAccountSummary', investment.account]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      await invalidate(['dashboardData']);
      showSuccess('Investment details updated successfully!');
      onInvestmentUpdated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update investment details.');
    }
  });

  const updateDividendMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DividendUpdateApiPayload }) =>
      investmentUpdateDividend(id, data),
    onSuccess: async () => {
      await invalidate(['investments', investment.account]);
      await invalidate(['investmentAccountSummary', investment.account]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      await invalidate(['dashboardData']);
      showSuccess('Dividend updated successfully!');
      onInvestmentUpdated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update dividend.');
    }
  });

  // --- Submit Handlers ---
  const handleDetailsUpdate = (data: InvestmentHoldingUpdateFormValues) => {
    // Data is already transformed by zod schema
    const apiPayload: InvestmentUpdateApiPayload = {
      shares: Number(data.shares),
      purchasePrice: Number(data.purchasePrice),
      purchaseDate: data.purchaseDate.toISOString()
    };
    updateInvestmentMutation.mutate({ id: investment.id, data: apiPayload });
  };

  const handleDividendUpdate = (data: DividendUpdateFormValues) => {
    // Data is already transformed by zod schema
    updateDividendMutation.mutate({ id: investment.id, data: { dividend: Number(data.dividend) } });
  };

  // --- Modal Close Handler ---
  const handleClose = useCallback(() => {
    if (!updateInvestmentMutation.isPending && !updateDividendMutation.isPending) {
      onOpenChange(false);
      // Reset happens via useEffect on isOpen change
    }
  }, [onOpenChange, updateInvestmentMutation.isPending, updateDividendMutation.isPending]);

  // Combined Pending State
  const isPending =
    updateInvestmentMutation.isPending ||
    updateDividendMutation.isPending ||
    isHistoricalPriceLoading;

  // Date Picker Disable Logic
  const disabledDates = (date: Date): boolean => {
    const todayStart = startOfDay(new Date());
    if (isWeekend(date)) return true;
    if (isFuture(startOfDay(date))) return true;
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[500px] md:max-w-[600px] [&>button:last-child]:hidden'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <Pencil className='h-5 w-5' /> Edit Investment
            </DialogTitle>
            <Badge variant='secondary'>{investment?.symbol}</Badge>
          </div>
          <DialogDescription className='pt-1.5'>
            Update the details or dividend information for {investment?.symbol}.
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

          <TabsContent value='details' className='pt-2'>
            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(handleDetailsUpdate)} className='space-y-5'>
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
                      {priceComparison && (
                        <div className='text-right'>
                          <div
                            className={cn(
                              'flex items-center justify-end gap-1 text-sm font-medium',
                              priceComparison.isPositive ? 'text-success' : 'text-destructive'
                            )}
                          >
                            {priceComparison.isPositive ? (
                              <TrendingUp className='h-4 w-4' />
                            ) : (
                              <TrendingDown className='h-4 w-4' />
                            )}
                            <span>{priceComparison.percentage.toFixed(1)}%</span>
                          </div>
                          <div className='text-muted-foreground text-xs'>vs Purchase</div>
                        </div>
                      )}
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
                          onChange={(newDate) => {
                            if (newDate) {
                              const validDate = getMostRecentValidDate(newDate);
                              if (!isSameDay(validDate, field.value)) {
                                field.onChange(validDate);
                                detailsForm.setValue('purchasePrice', ''); // Clear price if date changes
                              }
                            }
                          }}
                          disabled={disabledDates}
                          buttonDisabled={isPending}
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
                          <div className='relative'>
                            <NumericInput
                              placeholder='e.g., 10.5'
                              value={field.value} // Pass string value
                              onValueChange={(values: NumberFormatValues) =>
                                field.onChange(values.value)
                              }
                              disabled={isPending}
                              decimalScale={8}
                              ref={field.ref as React.Ref<HTMLInputElement>}
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
                          Purchase Price / Share*{' '}
                          {isHistoricalPriceLoading && (
                            <Loader2 className='text-primary h-3 w-3 animate-spin' />
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <NumericInput
                              placeholder='e.g., 150.75'
                              className='pr-10'
                              value={field.value} // Pass string value
                              onValueChange={(values: NumberFormatValues) =>
                                field.onChange(values.value)
                              }
                              disabled={isPending || isHistoricalPriceLoading}
                              suffix={` ${accountCurrency}`}
                              ref={field.ref as React.Ref<HTMLInputElement>}
                            />
                            {priceChange && (
                              <div className='absolute top-1/2 right-12 mr-1 -translate-y-1/2 transform'>
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

                {totalValue !== null && totalValue >= 0 && (
                  <Card className='border-primary/20 bg-muted/30 p-3'>
                    <h4 className='text-muted-foreground mb-1.5 text-xs font-medium'>
                      Updated Total Cost
                    </h4>
                    <div className='text-base font-semibold'>
                      {formatCurrency(totalValue, accountCurrency)}
                    </div>
                  </Card>
                )}

                <Separator />

                <DialogFooter className='flex flex-col gap-2 pt-2 sm:flex-row sm:gap-0'>
                  <DialogClose asChild>
                    <Button type='button' variant='outline' disabled={isPending}>
                      {' '}
                      Cancel{' '}
                    </Button>
                  </DialogClose>
                  <Button
                    type='submit'
                    disabled={
                      isPending || !detailsForm.formState.isValid || !detailsForm.formState.isDirty
                    }
                    className='min-w-[120px]'
                  >
                    {updateInvestmentMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Updating...
                      </>
                    ) : (
                      <>
                        <Check className='mr-2 h-4 w-4' /> Update Details
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
                        <div className='relative'>
                          <NumericInput
                            placeholder='e.g., 25.50'
                            className='pr-10'
                            value={field.value} // Pass string value
                            onValueChange={(values: NumberFormatValues) =>
                              field.onChange(values.value)
                            }
                            disabled={isPending}
                            suffix={` ${accountCurrency}`}
                            ref={field.ref as React.Ref<HTMLInputElement>}
                          />
                          {dividendChange && (
                            <div className='absolute top-1/2 right-12 mr-1 -translate-y-1/2 transform'>
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

                {dividendStr &&
                  !isNaN(parseFloat(dividendStr)) &&
                  totalValue !== null &&
                  totalValue > 0 && (
                    <Card className='border-primary/20 bg-muted/30 p-3'>
                      <h4 className='text-muted-foreground mb-1.5 text-xs font-medium'>
                        Estimated Dividend Yield
                      </h4>
                      <div className='text-base font-semibold'>
                        {dividendYield !== null ? `${dividendYield.toFixed(2)}%` : 'N/A'}
                      </div>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        (Based on updated total cost)
                      </p>
                    </Card>
                  )}

                <Separator />

                <DialogFooter className='flex flex-col gap-2 pt-3 sm:flex-row sm:gap-0'>
                  <DialogClose asChild>
                    <Button type='button' variant='outline' disabled={isPending}>
                      {' '}
                      Cancel{' '}
                    </Button>
                  </DialogClose>
                  <Button
                    type='submit'
                    disabled={
                      isPending ||
                      !dividendForm.formState.isValid ||
                      !dividendForm.formState.isDirty
                    }
                    className='min-w-[120px]'
                  >
                    {updateDividendMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Updating...
                      </>
                    ) : (
                      <>
                        <Check className='mr-2 h-4 w-4' /> Update Dividend
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
