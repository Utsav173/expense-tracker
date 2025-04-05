'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { investmentCreate } from '@/lib/endpoints/investment';
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
import DateTimePicker from '../date-time-picker';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { StockPriceResult, StockSearchResult } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Loader2, TrendingUp, Calendar, Layers } from 'lucide-react';
import { Combobox } from '../ui/combobox';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const investmentHoldingSchema = z.object({
  symbol: z
    .object({
      value: z.string().min(1, 'Symbol is required.'),
      label: z.string()
    })
    .refine((data) => data.value, { message: 'Symbol is required.' }),
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
  const [totalValue, setTotalValue] = useState<number | null>(null);

  const form = useForm<InvestmentHoldingFormSchema>({
    resolver: zodResolver(investmentHoldingSchema),
    defaultValues: {
      symbol: { value: '', label: '' },
      shares: '',
      purchasePrice: '',
      purchaseDate: new Date()
    },
    mode: 'onSubmit'
  });

  const selectedSymbol = form.watch('symbol');
  const shares = form.watch('shares');
  const purchasePrice = form.watch('purchasePrice');

  useEffect(() => {
    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(purchasePrice);

    if (!isNaN(sharesNum) && !isNaN(priceNum)) {
      setTotalValue(sharesNum * priceNum);
    } else {
      setTotalValue(null);
    }
  }, [shares, purchasePrice]);

  // Fetch current price when symbol changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (selectedSymbol?.value) {
        setIsPriceLoading(true);
        setCurrentPrice(null);
        try {
          const priceData = await getStockPriceFn(selectedSymbol.value);
          if (priceData?.price !== null && priceData?.price !== undefined) {
            setCurrentPrice(priceData.price);
          }
        } catch (error) {
          console.error('Error fetching stock price:', error);
        } finally {
          setIsPriceLoading(false);
        }
      } else {
        setCurrentPrice(null);
      }
    };
    fetchPrice();
  }, [selectedSymbol, getStockPriceFn]);

  const createInvestmentMutation = useMutation({
    mutationFn: (data: InvestmentHoldingFormSchema) =>
      investmentCreate({
        symbol: data.symbol.value,
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
      form.reset();
      onInvestmentAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleCreate = async (data: InvestmentHoldingFormSchema) => {
    createInvestmentMutation.mutate(data);
  };

  const fetchStocks = useCallback(
    async (query: string) => {
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
    if (currentPrice && purchasePrice && !isNaN(parseFloat(purchasePrice))) {
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
          {/* Symbol Search */}
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
                      onChange={field.onChange}
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

            {/* Current price information */}
            {selectedSymbol?.value && (
              <Card className='bg-muted/40 p-3'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm font-medium'>{selectedSymbol.label}</div>
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

          {/* Purchase Information */}
          <div>
            <h3 className='mb-3 flex items-center gap-1 text-sm font-medium'>
              Purchase Information
            </h3>

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
                        <Input
                          type='number'
                          step='any'
                          placeholder='e.g., 10.5'
                          className='pl-10'
                          {...field}
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
                    <FormLabel className='text-sm'>Purchase Price per Share</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type='number'
                          step='0.01'
                          placeholder='e.g., 150.75'
                          className='pl-10'
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='purchaseDate'
              render={({ field }) => (
                <FormItem className='mt-4 flex flex-col'>
                  <FormLabel className='flex items-center gap-1 text-sm'>
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

          {/* Summary Card */}
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
              disabled={createInvestmentMutation.isPending}
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
