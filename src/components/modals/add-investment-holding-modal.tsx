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
import type { InvestmentAPI } from '@/lib/api/api-types';
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
import { Card, CardContent } from '../ui/card';
import {
  format as formatDate,
  isValid as isDateValid,
  isWeekend,
  subDays,
  isFuture,
  startOfDay
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
  account: string;
};

interface AddInvestmentHoldingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountCurrency: string;
  onInvestmentAdded: () => void;
  searchStocksFn: (query: string) => Promise<InvestmentAPI.SearchStocksResponse | null>;
  getStockPriceFn: (symbol: string) => Promise<InvestmentAPI.StockPriceResult | null>;
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
      account: accountId
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
      <Form {...form}>
        <div className='mt-4 space-y-4 sm:space-y-6'>
          {/* Stock Symbol Search */}
          <FormField
            control={form.control}
            name='symbol'
            render={({ field }) => (
              <FormItem className='space-y-2 sm:space-y-3'>
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

          {/* Current Market Price Card - Mobile Optimized */}
          {selectedSymbolOption?.value && (
            <Card className='border-border bg-muted/30'>
              <CardContent className='p-3 sm:p-4'>
                <div className='w-full overflow-hidden'>
                  <div className='mb-3 flex items-center gap-2'>
                    <BarChart3 className='text-muted-foreground h-4 w-4 flex-shrink-0' />
                    <span className='text-muted-foreground truncate text-xs font-medium tracking-wide uppercase'>
                      Current Market Price
                    </span>
                  </div>

                  <div className='space-y-3'>
                    {/* Symbol Badge - Mobile First */}
                    <div className='flex min-w-0 items-center gap-2'>
                      <Badge variant='secondary' className='flex-shrink-0 font-mono text-xs'>
                        {selectedSymbolOption.value}
                      </Badge>
                    </div>

                    {/* Price Display - Mobile Stack */}
                    <div className='space-y-2'>
                      <div className='flex min-w-0 items-baseline gap-2'>
                        {isPriceLoading ? (
                          <Skeleton className='h-5 w-20 flex-shrink-0' />
                        ) : currentPriceInfo?.price !== null &&
                          currentPriceInfo?.price !== undefined ? (
                          <span className='truncate text-lg font-semibold'>
                            {formatCurrency(
                              currentPriceInfo.price,
                              currentPriceInfo.currency ?? accountCurrency
                            )}
                          </span>
                        ) : (
                          <span className='text-muted-foreground truncate text-sm'>
                            Price unavailable
                          </span>
                        )}
                      </div>

                      {/* Price Comparison - Separate Row on Mobile */}
                      {priceComparison && (
                        <div className='flex items-center justify-between'>
                          <div
                            className={cn(
                              'flex items-center gap-1 text-sm font-medium',
                              priceComparison.isPositive
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {priceComparison.isPositive ? (
                              <TrendingUp className='h-4 w-4 flex-shrink-0' />
                            ) : (
                              <TrendingDown className='h-4 w-4 flex-shrink-0' />
                            )}
                            <span className='truncate'>
                              {priceComparison.percentage > 0 ? '+' : ''}
                              {priceComparison.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <span className='text-muted-foreground flex-shrink-0 text-xs'>
                            vs Purchase
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Fields Container */}
          <div className='space-y-4 sm:space-y-6'>
            {/* Purchase Date */}
            <FormField
              control={form.control}
              name='purchaseDate'
              render={({ field }) => (
                <FormItem className='space-y-2 sm:space-y-3'>
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
                          if (
                            !field.value ||
                            !isDateValid(field.value) ||
                            formatDate(validDate, 'yyyy-MM-dd') !==
                              formatDate(field.value, 'yyyy-MM-dd')
                          ) {
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
                    <Alert className='border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'>
                      <AlertCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                      <AlertDescription className='text-xs text-amber-700 dark:text-amber-300'>
                        Weekend dates are automatically adjusted to the previous trading day.
                      </AlertDescription>
                    </Alert>
                  )}
                </FormItem>
              )}
            />

            {/* Shares and Price Grid - Mobile Optimized */}
            <div className='space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0'>
              {/* Number of Shares */}
              <FormField
                control={form.control}
                name='shares'
                render={({ field }) => (
                  <FormItem className='space-y-2 sm:space-y-3'>
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
                  <FormItem className='space-y-2 sm:space-y-3'>
                    <FormLabel className='flex flex-wrap items-center gap-2 text-sm font-medium'>
                      <div className='flex items-center gap-2'>
                        <IndianRupee className='text-muted-foreground h-4 w-4' />
                        <span>Price per Share</span>
                        <span className='text-destructive'>*</span>
                      </div>
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
          </div>

          {/* Total Investment Summary - Mobile Optimized */}
          {totalValue && totalValue > 0 && (
            <Card className='border-primary/20 bg-primary/5 dark:bg-primary/10'>
              <CardContent className='p-3 sm:p-4'>
                <div className='w-full space-y-3 overflow-hidden sm:flex sm:items-center sm:justify-between sm:space-y-0'>
                  <div className='flex min-w-0 items-start gap-3'>
                    <div className='bg-primary/10 flex-shrink-0 rounded-full p-2'>
                      <BarChart3 className='text-primary h-4 w-4' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-foreground text-sm font-medium'>Total Investment</p>
                      <p className='text-muted-foreground truncate text-xs'>
                        {parseFloat(sharesStr) || 0} shares ×{' '}
                        <span className='inline-block'>
                          {formatCurrency(parseFloat(purchasePriceStr) || 0, accountCurrency)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className='flex-shrink-0 text-left sm:text-right'>
                    <p className='text-primary text-xl font-bold'>
                      {formatCurrency(totalValue, accountCurrency)}
                    </p>
                    {priceComparison && currentPriceInfo?.price && (
                      <p className='text-muted-foreground truncate text-xs'>
                        Current value:{' '}
                        <span className='inline-block'>
                          {formatCurrency(
                            (parseFloat(sharesStr) || 0) * currentPriceInfo.price,
                            accountCurrency
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Text */}
          {selectedSymbolOption && !totalValue && (
            <Alert className='border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'>
              <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              <AlertDescription className='text-xs text-blue-700 dark:text-blue-300'>
                Enter the number of shares and purchase price to see your total investment.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Form>

      {/* Action Buttons - Mobile Optimized */}
      <div className='flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end sm:pt-6'>
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
    </AddModal>
  );
};

export default AddInvestmentHoldingModal;
