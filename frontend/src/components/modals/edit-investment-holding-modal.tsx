'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Investment Holding ({investment.symbol})</DialogTitle>
          <DialogDescription>Update the details or dividends for this holding.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='details'>Details</TabsTrigger>
            <TabsTrigger value='dividends'>Dividends</TabsTrigger>
          </TabsList>
          <TabsContent value='details'>
            <Form {...detailsForm}>
              <form
                onSubmit={detailsForm.handleSubmit(handleDetailsUpdate)}
                className='space-y-4 pt-4'
              >
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={detailsForm.control}
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
                    control={detailsForm.control}
                    name='purchasePrice'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price ({accountCurrency})</FormLabel>
                        <FormControl>
                          <Input type='number' step='0.01' placeholder='e.g., 150.75' {...field} />
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
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <DateTimePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className='pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={isPending}>
                    {updateInvestmentMutation.isPending ? 'Updating Details...' : 'Update Details'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value='dividends'>
            <Form {...dividendForm}>
              <form
                onSubmit={dividendForm.handleSubmit(handleDividendUpdate)}
                className='space-y-4 pt-4'
              >
                <FormField
                  control={dividendForm.control}
                  name='dividend'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Dividend Received ({accountCurrency})</FormLabel>
                      <FormControl>
                        <Input type='number' step='0.01' placeholder='e.g., 25.50' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className='pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={isPending}>
                    {updateDividendMutation.isPending ? 'Updating Dividend...' : 'Update Dividend'}
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
