'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { investmentCreate, investmentStockHistoricalPrice } from '@/lib/endpoints/investment';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import AddModal from './add-modal';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import DatePicker from '../date-picker';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { StockPriceResult, StockSearchResult } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Loader2, TrendingUp, Calendar, Layers } from 'lucide-react';
import { Combobox, ComboboxOption } from '../ui/combobox';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  format as formatDate,
  isValid as isDateValid,
  isWeekend,
  subDays,
  isFuture,
  startOfDay
} from 'date-fns';
import { useDebounce } from 'use-debounce';
import { NumericFormat } from 'react-number-format';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const investmentHoldingSchema = z.object({
  symbol: z
    .object({
      value: z.string().min(1, 'Symbol is required.'),
      label: z.string()
    })
    .nullable()
    .refine((data) => !!data?.value, { message: 'Symbol is required.' }),
  shares: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Shares must be a positive number'
  }),
  purchasePrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Purchase price must be a non-negative number'
  }),
  purchaseDate: z.date({ required_error: 'Purchase date is required.' })
});

type InvestmentHoldingFormSchema = z.infer<typeof investmentHoldingSchema>;

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
  let candidateDate = new Date(initialDate);
  const todayStart = startOfDay(new Date());

  if (startOfDay(candidateDate) > todayStart) {
    const now = new Date();
    candidateDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  }

  while (isWeekend(candidateDate) || startOfDay(candidateDate) > todayStart) {
    candidateDate = subDays(candidateDate, 1);
  }

  const referenceTime = initialDate || new Date();
  candidateDate.setHours(
    referenceTime.getHours(),
    referenceTime.getMinutes(),
    referenceTime.getSeconds()
  );

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
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [isHistoricalPriceLoading, setIsHistoricalPriceLoading] = useState(false);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [shouldFetchHistorical, setShouldFetchHistorical] = useState(false);

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

  const selectedSymbol = form.watch('symbol');
  const purchaseDate = form.watch('purchaseDate');
  const shares = form.watch('shares');
  const purchasePrice = form.watch('purchasePrice');

  const selectedSymbolValue = selectedSymbol?.value;
  // Ensure purchaseDate is always a Date object before calling methods
  const purchaseDateISO = purchaseDate instanceof Date ? purchaseDate.toISOString() : null;

  const [debouncedSymbolValue] = useDebounce(selectedSymbolValue, 1000);

  useEffect(() => {
    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(purchasePrice);
    setTotalValue(!isNaN(sharesNum) && !isNaN(priceNum) ? sharesNum * priceNum : null);
  }, [shares, purchasePrice]);

  useEffect(() => {
    let isMounted = true;

    const fetchPrice = async () => {
      if (!debouncedSymbolValue) {
        setCurrentPrice(null);
        return;
      }

      setIsPriceLoading(true);
      try {
        const priceData = await getStockPriceFn(debouncedSymbolValue);
        if (isMounted) {
          setCurrentPrice(priceData?.price ?? null);
        }
      } catch (error) {
        console.error('Error fetching current stock price:', error);
        if (isMounted) {
          setCurrentPrice(null);
        }
      } finally {
        if (isMounted) {
          setIsPriceLoading(false);
        }
      }
    };

    fetchPrice();

    return () => {
      isMounted = false;
    };
  }, [debouncedSymbolValue, getStockPriceFn]);

  useEffect(() => {
    if (debouncedSymbolValue && purchaseDateISO) {
      // Check if the date is valid and not a weekend before triggering fetch
      const dateObj = new Date(purchaseDateISO);
      if (isDateValid(dateObj) && !isWeekend(dateObj)) {
        setShouldFetchHistorical(true);
      }
    }
  }, [debouncedSymbolValue, purchaseDateISO]);

  useEffect(() => {
    if (!shouldFetchHistorical || !debouncedSymbolValue || !purchaseDateISO) {
      return;
    }

    let isMounted = true;
    const purchaseDateObj = new Date(purchaseDateISO);

    // Redundant check, but safe
    if (!isDateValid(purchaseDateObj) || isWeekend(purchaseDateObj) || isFuture(purchaseDateObj)) {
      setIsHistoricalPriceLoading(false);
      setShouldFetchHistorical(false);
      return;
    }

    const formattedDate = formatDate(purchaseDateObj, 'yyyy-MM-dd');

    const fetchHistoricalPrice = async () => {
      setIsHistoricalPriceLoading(true);
      try {
        const historicalPriceData = await investmentStockHistoricalPrice(
          debouncedSymbolValue,
          formattedDate
        );

        if (isMounted) {
          if (historicalPriceData?.price !== null && historicalPriceData?.price !== undefined) {
            form.setValue('purchasePrice', historicalPriceData.price.toString(), {
              shouldValidate: true,
              shouldDirty: true
            });
          } else {
            showError(
              `Could not auto-fetch price for ${debouncedSymbolValue} on ${formattedDate}. Please enter manually.`
            );
            // Optionally clear the price field if fetch fails:
            // form.setValue('purchasePrice', '', { shouldValidate: true });
          }
        }
      } catch (error: any) {
        if (isMounted) {
          showError(`Error fetching historical price: ${error.message}`);
          // Optionally clear the price field on error:
          // form.setValue('purchasePrice', '', { shouldValidate: true });
        }
      } finally {
        if (isMounted) {
          setIsHistoricalPriceLoading(false);
          setShouldFetchHistorical(false);
        }
      }
    };

    fetchHistoricalPrice();

    return () => {
      isMounted = false;
    };
  }, [debouncedSymbolValue, purchaseDateISO, shouldFetchHistorical, form, showError]);

  const createInvestmentMutation = useMutation({
    mutationFn: (data: InvestmentHoldingFormSchema) =>
      investmentCreate({
        symbol: data.symbol!.value,
        shares: Number(data.shares),
        purchasePrice: Number(data.purchasePrice),
        purchaseDate: data.purchaseDate.toISOString(),
        investmentAccount: accountId
      }),
    onSuccess: async () => {
      await invalidate(['investments', accountId]);
      await invalidate(['investmentAccountSummary', accountId]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      showSuccess('Investment added successfully!');
      form.reset({
        symbol: null,
        shares: '',
        purchasePrice: '',
        purchaseDate: new Date()
      });
      onInvestmentAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to add investment');
    }
  });

  const handleCreate = async (data: InvestmentHoldingFormSchema) => {
    if (!data.symbol?.value) {
      form.setError('symbol', { type: 'manual', message: 'Symbol is required.' });
      return;
    }
    createInvestmentMutation.mutate(data);
  };

  const fetchStocks = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      if (!query || query.length < 2) return [];
      try {
        const results = await searchStocksFn(query);
        return (
          results?.map((stock) => ({
            value: stock.symbol,
            label: `${stock.symbol} - ${stock.name}`
          })) || []
        );
      } catch (error) {
        console.error('Stock search failed:', error);
        return [];
      }
    },
    [searchStocksFn]
  );

  const calculateComparison = () => {
    if (
      currentPrice !== null &&
      purchasePrice &&
      !isNaN(parseFloat(purchasePrice)) &&
      parseFloat(purchasePrice) !== 0
    ) {
      const purchasePriceNum = parseFloat(purchasePrice);
      const diff = currentPrice - purchasePriceNum;
      const percentage = (diff / purchasePriceNum) * 100;

      return {
        diff,
        percentage,
        isPositive: diff >= 0
      };
    }
    return null;
  };

  const priceComparison = calculateComparison();

  useEffect(() => {
    if (!isOpen) {
      setShouldFetchHistorical(false);
      form.reset({
        symbol: null,
        shares: '',
        purchasePrice: '',
        purchaseDate: getMostRecentValidDate()
      });
    }
  }, [isOpen, form]);

  const disabledWeekends = (date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    return isWeekend && !isToday;
  };
  const disableFutureDates = { after: new Date() };

  return (
    <AddModal
      title='Add Investment Holding'
      description='Add a new stock or asset to this investment account.'
      triggerButton={
        hideTriggerButton ? null : (
          <Button className='flex items-center gap-2'>
            <TrendingUp className='h-4 w-4' />
            <span>Add Investment</span>
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-6'>
          <div className='space-y-2'>
            <FormField
              control={form.control}
              name='symbol'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel className='flex items-center gap-2 font-medium'>
                    <TrendingUp className='h-4 w-4 text-primary' />
                    Stock Symbol / Ticker
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      value={field.value}
                      onChange={(option) => {
                        field.onChange(option);
                        setCurrentPrice(null);
                        form.setValue('purchasePrice', '', {
                          shouldValidate: true
                        });
                      }}
                      fetchOptions={fetchStocks}
                      placeholder='Search for stock (e.g., AAPL, MSFT, GOOGL)...'
                      loadingPlaceholder='Searching stocks...'
                      noOptionsMessage='No stocks found. Try a different search term.'
                      className='w-full'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedSymbol?.value && (
              <Card className='bg-muted/40 p-3'>
                <div className='flex items-center justify-between'>
                  <div className='truncate pr-2 text-sm font-medium'>{selectedSymbol.label}</div>
                  <Badge variant={isPriceLoading ? 'outline' : 'secondary'} className='ml-auto'>
                    {selectedSymbol.value}
                  </Badge>
                </div>
                <div className='mt-2 text-sm'>
                  {isPriceLoading ? (
                    <span className='flex items-center gap-1 text-muted-foreground'>
                      <Loader2 className='h-3 w-3 animate-spin' /> Fetching current price...
                    </span>
                  ) : currentPrice !== null ? (
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground'>Current Market Price:</span>
                        <span className='font-medium'>
                          {formatCurrency(currentPrice, accountCurrency)}
                        </span>
                      </div>
                      {priceComparison && purchasePrice && !isNaN(parseFloat(purchasePrice)) && (
                        <div className='mt-1 flex items-center justify-between'>
                          <span className='text-muted-foreground'>Compared to Purchase:</span>
                          <span
                            className={`font-medium ${priceComparison.isPositive ? 'text-green-500' : 'text-red-500'}`}
                          >
                            {priceComparison.isPositive ? '+' : ''}
                            {priceComparison.percentage.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className='text-muted-foreground'>Could not fetch current price</span>
                  )}
                </div>
              </Card>
            )}
          </div>
          <Separator />
          <div>
            <h3 className='mb-3 flex items-center gap-1 text-sm font-medium'>
              Purchase Information
            </h3>
            <FormField
              control={form.control}
              name='purchaseDate'
              render={({ field }) => (
                <FormItem className='mb-4 flex flex-col'>
                  <FormLabel className='flex items-center gap-1 text-sm'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    Purchase Date
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(newDate) => {
                        if (newDate) {
                          // We don't need getMostRecentValidDate here on change
                          // because the DateTimePicker's internal Calendar
                          // already prevents selecting disabled dates.
                          field.onChange(newDate);
                          if (selectedSymbolValue) {
                            setShouldFetchHistorical(true);
                          }
                        }
                      }}
                      disabled={[disabledWeekends, disableFutureDates]}
                      buttonDisabled={new Date(field.value) > new Date()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='shares'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Number of Shares</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Layers className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground' />
                        <NumericFormat
                          customInput={Input}
                          thousandSeparator=','
                          decimalSeparator='.'
                          allowNegative={false}
                          placeholder='e.g., 10.5'
                          className='pl-10'
                          onValueChange={(values) => field.onChange(values.value)}
                          value={field.value}
                        />
                      </div>
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
                    <FormLabel className='flex items-center gap-1.5 text-sm'>
                      Purchase Price per Share
                      {isHistoricalPriceLoading && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Loader2 className='h-3 w-3 animate-spin text-primary' />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Fetching price for selected date...</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
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
                          className='pr-10'
                          onValueChange={(values) => field.onChange(values.value)}
                          value={field.value}
                        />
                        <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transform text-xs text-muted-foreground'>
                          {accountCurrency}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          {totalValue !== null && (
            <Card className='border-primary/20 bg-muted/30 p-4'>
              <h3 className='mb-2 text-sm font-medium'>Investment Summary</h3>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div className='text-muted-foreground'>Total Investment Value:</div>
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
          <div className='space-y-3 pt-2'>
            <Button
              type='submit'
              disabled={createInvestmentMutation.isPending || isHistoricalPriceLoading}
              className='h-11 w-full font-medium'
            >
              {createInvestmentMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Adding Investment...
                </>
              ) : (
                <>
                  <TrendingUp className='mr-2 h-4 w-4' />
                  Add Investment Holding
                </>
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='w-full'
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddInvestmentHoldingModal;
