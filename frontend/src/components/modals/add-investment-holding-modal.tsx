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
  TrendingDown
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
  const { showSuccess, showError, showInfo } = useToast();
  const invalidate = useInvalidateQueries();
  const queryClient = useQueryClient();

  const form = useForm<InvestmentHoldingFormSchema>({
    resolver: zodResolver(investmentHoldingSchema),
    defaultValues: {
      symbol: null, // Start with null
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
    return !isNaN(sharesNum) && !isNaN(priceNum) ? sharesNum * priceNum : null;
  }, [sharesStr, purchasePriceStr]);

  // --- useQuery for Current Price ---
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

  // --- useQuery for Historical Price ---
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

  // --- Effect to update form with fetched historical price ---
  useEffect(() => {
    if (
      canFetchHistorical &&
      !isHistoricalPriceLoading &&
      historicalPriceData?.price !== null &&
      historicalPriceData?.price !== undefined
    ) {
      const fetchedPriceString = historicalPriceData.price.toString();
      // Only update if the fetched price is different from the current input
      if (fetchedPriceString !== form.getValues('purchasePrice')) {
        form.setValue('purchasePrice', fetchedPriceString, {
          shouldValidate: true,
          shouldDirty: true
        });
        showInfo(`Auto-filled price for ${debouncedSymbolValue} on ${formattedPurchaseDate}.`);
      }
    } else if (canFetchHistorical && !isHistoricalPriceLoading && historicalPriceData) {
      // If fetch succeeded but price is null/undefined
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
    showInfo,
    showError
  ]);

  // --- Price Comparison Memo ---
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

  // --- Mutation for Creating Investment ---
  const createInvestmentMutation = useMutation({
    mutationFn: (data: InvestmentApiPayload) => investmentCreate(data),
    onSuccess: async () => {
      await invalidate(['investments', accountId]);
      await invalidate(['investmentAccountSummary', accountId]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      await invalidate(['dashboardData']); // Invalidate dashboard too
      showSuccess('Investment added successfully!');
      onInvestmentAdded();
      handleClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to add investment.';
      showError(message);
    }
  });

  // --- Form Submission Handler ---
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

  // --- Stock Search Function ---
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

  // --- Modal Close Handler ---
  const handleClose = useCallback(() => {
    form.reset({
      symbol: null,
      shares: '',
      purchasePrice: '',
      purchaseDate: getMostRecentValidDate()
    });
    // Reset query data if needed, or let cache handle it
    queryClient.removeQueries({ queryKey: ['stockPrice', debouncedSymbolValue], exact: true });
    queryClient.removeQueries({
      queryKey: ['historicalStockPrice', debouncedSymbolValue, formattedPurchaseDate],
      exact: true
    });

    onOpenChange(false);
  }, [form, onOpenChange, queryClient, debouncedSymbolValue, formattedPurchaseDate]);

  // --- Disable Past Dates/Weekends ---
  const disabledDates = (date: Date): boolean => {
    if (isWeekend(date)) return true;
    if (isFuture(startOfDay(date))) return true;
    return false;
  };

  // Combine all pending states
  const isPending =
    createInvestmentMutation.isPending || isPriceLoading || isHistoricalPriceLoading;

  return (
    <AddModal
      title='Add Investment Holding'
      description={`Add a new stock or asset to ${accountCurrency} account.`}
      triggerButton={
        hideTriggerButton ? null : (
          <Button>
            <PlusCircle className='mr-2 h-4 w-4' /> Add Holding
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={handleClose}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCreate)}
          className='grid grid-cols-1 gap-5 pt-2 md:grid-cols-2'
        >
          <FormField
            control={form.control}
            name='symbol'
            render={({ field }) => (
              <FormItem className='md:col-span-2'>
                <FormLabel className='flex items-center gap-1.5'>
                  <Search className='text-muted-foreground h-4 w-4' />
                  Stock Symbol / Ticker*
                </FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onChange={(option) => {
                      field.onChange(option);
                      form.setValue('purchasePrice', '', { shouldValidate: true });
                    }}
                    fetchOptions={fetchStocks}
                    placeholder='Search (e.g., AAPL, MSFT)'
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

          {/* Display Current Price Info Card */}
          {selectedSymbolOption?.value && (
            <Card className='border-border/50 bg-muted/30 md:col-span-2'>
              <CardHeader className='flex flex-row items-center justify-between p-3'>
                <div className='space-y-0.5'>
                  <CardDescription className='text-xs'>
                    Current Market Info ({selectedSymbolOption.value})
                  </CardDescription>
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

          {/* Purchase Date */}
          <FormField
            control={form.control}
            name='purchaseDate'
            render={({ field }) => (
              <FormItem className='flex flex-col md:col-span-2'>
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
                          form.setValue('purchasePrice', '', { shouldValidate: true }); // Clear price on date change
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

          {/* Shares */}
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
                <FormLabel className='flex items-center gap-1.5'>
                  Purchase Price / Share*{' '}
                  {isHistoricalPriceLoading && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='cursor-help'>
                            <Loader2 className='text-primary h-3 w-3 animate-spin' />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fetching price...</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </FormLabel>
                <FormControl>
                  <NumericInput
                    placeholder='e.g., 150.75'
                    className='w-full pr-10'
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

          {/* Total Investment Cost Card */}
          {totalValue !== null && totalValue > 0 && (
            <Card className='border-primary/20 bg-muted/30 md:col-span-2'>
              <CardContent className='p-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Total Investment Cost</span>
                  <span className='font-semibold'>
                    {formatCurrency(totalValue, accountCurrency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className='flex justify-end gap-2 pt-4 md:col-span-2'>
            <Button type='button' variant='outline' onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isPending || !form.formState.isValid}
              className='min-w-[120px]'
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
        </form>
      </Form>
    </AddModal>
  );
};

export default AddInvestmentHoldingModal;
