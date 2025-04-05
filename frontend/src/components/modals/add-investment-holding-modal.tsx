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
import { Loader2 } from 'lucide-react';
import { Combobox } from '../ui/combobox';

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

  return (
    <AddModal
      title='Add Investment Holding'
      description='Add a new stock or asset to this investment account.'
      triggerButton={hideTriggerButton ? null : <Button>Add Investment</Button>}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-4'>
          <FormField
            control={form.control}
            name='symbol'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel>Stock Symbol / Ticker</FormLabel>
                <Combobox
                  value={field.value}
                  onChange={field.onChange}
                  fetchOptions={fetchStocks}
                  placeholder='Search for stock...'
                  loadingPlaceholder='Searching stocks...'
                  noOptionsMessage='No stocks found.'
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedSymbol?.value && (
            <div className='text-xs text-muted-foreground'>
              {isPriceLoading ? (
                <span className='flex items-center gap-1'>
                  <Loader2 className='h-3 w-3 animate-spin' /> Fetching current price...
                </span>
              ) : currentPrice !== null ? (
                <span>Current Price: {formatCurrency(currentPrice, accountCurrency)}</span>
              ) : (
                <span>Could not fetch current price.</span>
              )}
            </div>
          )}

          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='shares'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Shares</FormLabel>
                  <FormControl>
                    <Input type='number' step='any' placeholder='e.g., 10.5' {...field} />
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
                  <FormLabel>Purchase Price per Share</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.01' placeholder='e.g., 150.75' {...field} />
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
              <FormItem className='flex flex-col'>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <DateTimePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={createInvestmentMutation.isPending} className='w-full'>
            {createInvestmentMutation.isPending ? 'Adding...' : 'Add Holding'}
          </Button>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddInvestmentHoldingModal;
