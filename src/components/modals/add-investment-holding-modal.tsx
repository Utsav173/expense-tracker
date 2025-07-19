'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { investmentCreate, investmentStockHistoricalPrice } from '@/lib/endpoints/investment';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { StockPriceResult, StockSearchResult } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Loader2,
  TrendingUp,
  Calendar,
  Layers,
  Search,
  PlusCircle,
  TrendingDown,
  BarChart3,
  IndianRupee,
  Info,
  AlertCircle
} from 'lucide-react';
import { Combobox, ComboboxOption } from '../ui/combobox';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import {
  format as formatDate,
  isValid as isDateValid,
  isWeekend,
  subDays,
  isFuture,
  startOfDay,
  isSameDay
} from 'date-fns';
import { useDebounce } from 'use-debounce';
import { NumericInput } from '../ui/numeric-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import DatePicker from '../date/date-picker';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

const investmentHoldingSchema = z.object({
  symbol: z
    .object(
      {
        value: z.string().min(1, 'Symbol is required.'),
        label: z.string()
      },
      { required_error: 'Symbol is required.' }
    )
    .nullable()
    .refine((data) => data !== null && data.value !== '', { message: 'Symbol is required.' }),
  shares: z
    .string()
    .min(1, 'Number of shares is required.')
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

type InvestmentHoldingFormSchema = z.infer<typeof investmentHoldingSchema>;

type InvestmentApiPayload = {
  symbol: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string;
  investmentAccount: string;
};

interface AddInvestmentHoldingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountCurrency: string;
  onInvestmentAdded: () => void;
  searchStocksFn: (query: string) => Promise<StockSearchResult[] | null>;
  getStockPriceFn: (symbol: string) => Promise<StockPriceResult | null>;
  hideTriggerButton?: boolean;
}

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

const AddInvestmentHoldingModal: React.FC<AddInvestmentHoldingModalProps> = ({
  isOpen,
  onOpenChange,
  accountId,
  accountCurrency,
  onInvestmentAdded,
  searchStocksFn,
  getStockPriceFn,
  hideTriggerButton = false
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();
  const queryClient = useQueryClient();

  const form = useForm<InvestmentHoldingFormSchema>({
    resolver: zodResolver(investmentHoldingSchema),
    defaultValues: {
      symbol: null,
      shares: '',
      purchasePrice: '',
      purchaseDate: getMostRecentValidDate()
    },
    mode: 'onChange'
  });

  const selectedSymbolOption = form.watch('symbol');
  const purchaseDate = form.watch('purchaseDate');
  const sharesStr = form.watch('shares');
  const purchasePriceStr = form.watch('purchasePrice');

  const [debouncedSymbolValue] = useDebounce(selectedSymbolOption?.value, 500);

  const totalValue = useMemo(() => {
    const sharesNum = parseFloat(sharesStr);
    const priceNum = parseFloat(purchasePriceStr);
    return !isNaN(sharesNum) && !isNaN(priceNum) && sharesNum > 0 && priceNum > 0
      ? sharesNum * priceNum
      : null;
  }, [sharesStr, purchasePriceStr]);

  const { data: currentPriceInfo, isLoading: isPriceLoading } = useQuery({
    queryKey: ['stockPrice', debouncedSymbolValue],
    queryFn: async () => {
      if (!debouncedSymbolValue) return null;
      return getStockPriceFn(debouncedSymbolValue);
    },
    enabled: !!debouncedSymbolValue,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true
  });

  const formattedPurchaseDate = useMemo(() => {
    return purchaseDate && isDateValid(purchaseDate)
      ? formatDate(purchaseDate, 'yyyy-MM-dd')
      : null;
  }, [purchaseDate]);

  const canFetchHistorical = useMemo(() => {
    return (
      !!debouncedSymbolValue &&
      !!formattedPurchaseDate &&
      !isWeekend(new Date(formattedPurchaseDate)) &&
      !isFuture(startOfDay(new Date(formattedPurchaseDate)))
    );
  }, [debouncedSymbolValue, formattedPurchaseDate]);

  const { isLoading: isHistoricalPriceLoading, data: historicalPriceData } = useQuery({
    queryKey: ['historicalStockPrice', debouncedSymbolValue, formattedPurchaseDate],
    queryFn: async () => {
      if (!debouncedSymbolValue || !formattedPurchaseDate) return null;
      return investmentStockHistoricalPrice(debouncedSymbolValue, formattedPurchaseDate);
    },
    enabled: canFetchHistorical,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1
  });

  useEffect(() => {
    if (
      canFetchHistorical &&
      !isHistoricalPriceLoading &&
      historicalPriceData?.price !== null &&
      historicalPriceData?.price !== undefined
    ) {
      const fetchedPriceString = historicalPriceData.price.toString();

      if (fetchedPriceString !== form.getValues('purchasePrice')) {
        form.setValue('purchasePrice', fetchedPriceString, {
          shouldValidate: true,
          shouldDirty: true
        });
        showSuccess(`Auto-filled price for ${debouncedSymbolValue} on ${formattedPurchaseDate}.`);
      }
    } else if (canFetchHistorical && !isHistoricalPriceLoading && historicalPriceData) {
      showError(
        `Could not auto-fetch price for ${debouncedSymbolValue} on ${formattedPurchaseDate}. Enter manually.`
      );
    }
  }, [
    historicalPriceData,
    isHistoricalPriceLoading,
    canFetchHistorical,
    form,
    debouncedSymbolValue,
    formattedPurchaseDate,
    showSuccess,
    showError
  ]);

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
      return { diff, percentage, isPositive: diff >= 0 };
    }
    return null;
  }, [currentPriceInfo?.price, purchasePriceStr]);

  const createInvestmentMutation = useMutation({
    mutationFn: (data: InvestmentApiPayload) => investmentCreate(data),
    onSuccess: async () => {
      await Promise.all([
        invalidate(['investments', accountId]),
        invalidate(['investmentAccountSummary', accountId]),
        invalidate(['investmentPortfolioSummaryDashboard']),
        invalidate(['investmentAccount']),
        invalidate(['investmentAccountPerformance']),
        invalidate(['dashboardData'])
      ]);
      onInvestmentAdded();
      handleClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to add investment.';
      showError(message);
    }
  });

  const handleCreate = (data: InvestmentHoldingFormSchema) => {
    if (!data.symbol?.value) {
      form.setError('symbol', { message: 'Symbol is required.' });
      return;
    }

    const apiPayload: InvestmentApiPayload = {
      symbol: data.symbol.value,
      shares: parseFloat(data.shares),
      purchasePrice: parseFloat(data.purchasePrice),
      purchaseDate: data.purchaseDate.toISOString(),
      investmentAccount: accountId
    };
    createInvestmentMutation.mutate(apiPayload);
  };

  const fetchStocks = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      if (!query || query.length < 1) return [];
      try {
        const results = await searchStocksFn(query);
        return (
          results?.map((stock) => ({
            value: stock.symbol,
            label: `${stock.symbol} - ${stock.name} (${stock.exchange})`
          })) || []
        );
      } catch (error) {
        console.error('Stock search failed:', error);
        return [];
      }
    },
    [searchStocksFn]
  );

  const handleClose = useCallback(() => {
    form.reset({
      symbol: null,
      shares: '',
      purchasePrice: '',
      purchaseDate: getMostRecentValidDate()
    });

    // Clean up queries
    queryClient.removeQueries({ queryKey: ['stockPrice', debouncedSymbolValue], exact: true });
    queryClient.removeQueries({
      queryKey: ['historicalStockPrice', debouncedSymbolValue, formattedPurchaseDate],
      exact: true
    });

    onOpenChange(false);
  }, [form, onOpenChange, queryClient, debouncedSymbolValue, formattedPurchaseDate]);

  const disabledDates = useCallback((date: Date): boolean => {
    if (isWeekend(date) || isFuture(startOfDay(date))) return true;
    return false;
  }, []);

  const isPending =
    createInvestmentMutation.isPending || isPriceLoading || isHistoricalPriceLoading;
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <AddModal
      title='Add Investment Holding'
      description={`Add a new stock or asset to your ${accountCurrency} investment account`}
      triggerButton={
        hideTriggerButton ? null : (
          <Button className='w-full sm:w-auto'>
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Holding
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={handleClose}
    >
      <div className='max-h-[80vh] space-y-4 px-1'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-4'>
            {/* Stock Symbol Search */}
            <FormField
              control={form.control}
              name='symbol'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2 text-sm font-medium'>
                    <Search className='text-muted-foreground h-4 w-4' />
                    Stock Symbol
                    <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      value={field.value}
                      onChange={(option) => {
                        field.onChange(option);
                        form.setValue('purchasePrice', '', { shouldValidate: true });
                      }}
                      fetchOptions={fetchStocks}
                      placeholder='Search stocks (e.g., AAPL, MSFT)'
                      loadingPlaceholder='Searching stocks...'
                      noOptionsMessage='No stocks found. Try a different term.'
                      className='w-full'
                      disabled={createInvestmentMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Market Price Card - Responsive */}
            {selectedSymbolOption?.value && (
              <Card className='border-muted bg-muted/20 transition-all duration-200'>
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <BarChart3 className='text-muted-foreground h-4 w-4' />
                        <CardDescription className='text-xs font-medium tracking-wide uppercase'>
                          Current Market Price
                        </CardDescription>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant='secondary' className='font-mono text-xs'>
                          {selectedSymbolOption.value}
                        </Badge>
                        <div className='text-lg font-bold'>
                          {isPriceLoading ? (
                            <Skeleton className='h-6 w-20' />
                          ) : currentPriceInfo?.price !== null &&
                            currentPriceInfo?.price !== undefined ? (
                            <span className='text-foreground'>
                              {formatCurrency(
                                currentPriceInfo.price,
                                currentPriceInfo.currency ?? accountCurrency
                              )}
                            </span>
                          ) : (
                            <span className='text-muted-foreground text-sm'>Price unavailable</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price Comparison - Stack on mobile */}
                    {priceComparison && (
                      <div className='flex items-center justify-start gap-3 sm:flex-col sm:items-end sm:justify-center'>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 text-sm font-semibold',
                            priceComparison.isPositive
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {priceComparison.isPositive ? (
                            <TrendingUp className='h-4 w-4' />
                          ) : (
                            <TrendingDown className='h-4 w-4' />
                          )}
                          <span>
                            {priceComparison.percentage > 0 ? '+' : ''}
                            {priceComparison.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className='text-muted-foreground text-xs'>vs Purchase</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Purchase Date */}
            <FormField
              control={form.control}
              name='purchaseDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2 text-sm font-medium'>
                    <Calendar className='text-muted-foreground h-4 w-4' />
                    Purchase Date
                    <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(newDate) => {
                        if (newDate) {
                          const validDate = getMostRecentValidDate(newDate);
                          if (!isSameDay(validDate, field.value)) {
                            field.onChange(validDate);
                            form.setValue('purchasePrice', '', { shouldValidate: true });
                          }
                        }
                      }}
                      disabled={disabledDates}
                      buttonDisabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                  {isWeekend(field.value) && (
                    <Alert className='mt-2'>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription className='text-xs'>
                        Weekend dates are automatically adjusted to the previous trading day.
                      </AlertDescription>
                    </Alert>
                  )}
                </FormItem>
              )}
            />

            {/* Shares and Price - Responsive Grid */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Number of Shares */}
              <FormField
                control={form.control}
                name='shares'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2 text-sm font-medium'>
                      <Layers className='text-muted-foreground h-4 w-4' />
                      Shares
                      <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <NumericInput
                        placeholder='e.g., 10.5'
                        className='w-full'
                        value={field.value}
                        onValueChange={(values: { value: string }) => field.onChange(values.value)}
                        disabled={isPending}
                        ref={field.ref as React.Ref<HTMLInputElement>}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Purchase Price */}
              <FormField
                control={form.control}
                name='purchasePrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2 text-sm font-medium'>
                      <IndianRupee className='text-muted-foreground h-4 w-4' />
                      Price per Share
                      <span className='text-destructive'>*</span>
                      {isHistoricalPriceLoading && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Loader2 className='text-primary h-3 w-3 animate-spin' />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Auto-filling historical price...</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </FormLabel>
                    <FormControl>
                      <NumericInput
                        placeholder='e.g., 150.75'
                        className='w-full'
                        value={field.value}
                        onValueChange={(values: { value: string }) => field.onChange(values.value)}
                        disabled={isPending || isHistoricalPriceLoading}
                        suffix={` ${accountCurrency}`}
                        ref={field.ref as React.Ref<HTMLInputElement>}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Investment Summary - Enhanced */}
            {totalValue && totalValue > 0 && (
              <Card className='border-primary/30 bg-primary/5 transition-all duration-200'>
                <CardContent className='p-4'>
                  <div className='flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 rounded-full p-2'>
                        <BarChart3 className='text-primary h-4 w-4' />
                      </div>
                      <div>
                        <p className='text-foreground text-sm font-semibold'>Total Investment</p>
                        <p className='text-muted-foreground text-xs'>
                          {parseFloat(sharesStr) || 0} shares ×{' '}
                          {formatCurrency(parseFloat(purchasePriceStr) || 0, accountCurrency)}
                        </p>
                      </div>
                    </div>
                    <div className='text-left sm:text-right'>
                      <p className='text-primary text-lg font-bold'>
                        {formatCurrency(totalValue, accountCurrency)}
                      </p>
                      {priceComparison && (
                        <p className='text-muted-foreground text-xs'>
                          Current value:{' '}
                          {formatCurrency(
                            (parseFloat(sharesStr) || 0) * (currentPriceInfo?.price || 0),
                            accountCurrency
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Text */}
            {selectedSymbolOption && !totalValue && (
              <Alert>
                <Info className='h-4 w-4' />
                <AlertDescription className='text-xs'>
                  Enter the number of shares and purchase price to see your total investment.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </Form>

        {/* Action Buttons - Fixed at bottom */}
        <div className='bg-background sticky bottom-0 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isPending}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleCreate)}
            disabled={isPending || !form.formState.isValid || hasErrors}
            className='w-full sm:w-auto sm:min-w-[140px]'
          >
            {createInvestmentMutation.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className='mr-2 h-4 w-4' />
                Add Holding
              </>
            )}
          </Button>
        </div>
      </div>
    </AddModal>
  );
};

export default AddInvestmentHoldingModal;
