'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  investmentUpdate,
  investmentUpdateDividend,
  investmentStockHistoricalPrice
} from '@/lib/endpoints/investment';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import type { InvestmentAPI } from '@/lib/api/api-types';
import {
  format as formatDate,
  isValid as isDateValid,
  isWeekend,
  subDays,
  isFuture,
  startOfDay,
  parseISO
} from 'date-fns';

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

export const useInvestmentHoldingForm = ({
  investment,
  onInvestmentUpdated,
  getStockPriceFn,
  isOpen
}: {
  investment: InvestmentAPI.Investment;
  onInvestmentUpdated: () => void;
  getStockPriceFn?: (symbol: string) => Promise<InvestmentAPI.StockPriceResult | null>;
  isOpen: boolean;
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();
  const [isHistoricalPriceLoading, setIsHistoricalPriceLoading] = useState(false);

  const detailsForm = useForm<z.infer<typeof investmentHoldingUpdateSchema>>({
    resolver: zodResolver(investmentHoldingUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      shares: String(investment.shares || ''),
      purchasePrice: String(investment.purchasePrice || ''),
      purchaseDate:
        typeof investment.purchaseDate === 'string' && investment.purchaseDate
          ? parseISO(investment.purchaseDate)
          : getMostRecentValidDate()
    }
  });

  const dividendForm = useForm<z.infer<typeof dividendUpdateSchema>>({
    resolver: zodResolver(dividendUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      dividend: String(investment.dividend || '0')
    }
  });

  const purchaseDate = detailsForm.watch('purchaseDate');
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

  const { data: historicalPriceData } = useQuery({
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
          showSuccess(`Auto-filled price for ${investment?.symbol} on ${formattedPurchaseDate}.`);
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
    showSuccess,
    showError
  ]);

  const updateInvestmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => investmentUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['investments', investment.account]);
      await invalidate(['investmentAccountSummary', investment.account]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      await invalidate(['dashboardData']);
      showSuccess('Investment details updated successfully!');
      onInvestmentUpdated();
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update investment details.');
    }
  });

  const updateDividendMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => investmentUpdateDividend(id, data),
    onSuccess: async () => {
      await invalidate(['investments', investment.account]);
      await invalidate(['investmentAccountSummary', investment.account]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      await invalidate(['dashboardData']);
      onInvestmentUpdated();
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update dividend.');
    }
  });

  return {
    detailsForm,
    dividendForm,
    updateInvestmentMutation,
    updateDividendMutation,
    isHistoricalPriceLoading,
    currentPriceInfo,
    isPriceLoading
  };
};
