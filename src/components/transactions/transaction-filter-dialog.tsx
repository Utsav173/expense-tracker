'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';
import CategoryCombobox from '@/components/ui/category-combobox';
import type { AccountAPI, TransactionAPI } from '@/lib/api/api-types';
import { DateRange } from 'react-day-picker';
import { Icon } from '@/components/ui/icon';

export interface FilterState {
  accountId?: string;
  categoryId?: string;
  isIncome?: boolean;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: 'recurring' | 'normal' | 'all';
}

interface TransactionFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  activeFilters: FilterState;
  onApplyFilters: (filters: Partial<FilterState>) => void;
  accounts: AccountAPI.SimpleAccount[] | undefined;
  isLoadingAccounts: boolean;
  transactionsData: TransactionAPI.GetTransactionsResponse | undefined;
  showAccountFilter?: boolean;
}

export const TransactionFilterDialog: React.FC<TransactionFilterDialogProps> = ({
  isOpen,
  onOpenChange,
  activeFilters,
  onApplyFilters,
  accounts,
  isLoadingAccounts,
  transactionsData,
  showAccountFilter = true
}) => {
  const [tempFilters, setTempFilters] = useState<FilterState & { dateRange?: DateRange }>({});

  useEffect(() => {
    if (isOpen) {
      setTempFilters({
        ...activeFilters,
        dateRange:
          activeFilters.dateFrom && activeFilters.dateTo
            ? { from: new Date(activeFilters.dateFrom), to: new Date(activeFilters.dateTo) }
            : undefined
      });
    }
  }, [isOpen, activeFilters]);

  const handleApply = () => {
    const finalFilters: Partial<FilterState> = {
      ...tempFilters,
      dateFrom: tempFilters.dateRange?.from?.toISOString(),
      dateTo: tempFilters.dateRange?.to?.toISOString()
    };
    delete (finalFilters as any).dateRange;
    onApplyFilters(finalFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    const clearedState: FilterState = {
      accountId: showAccountFilter ? undefined : activeFilters.accountId,
      categoryId: undefined,
      isIncome: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      type: 'all'
    };
    setTempFilters(clearedState);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] overflow-y-scroll sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icon name='filter' className='h-5 w-5' />
            Filter Transactions
          </DialogTitle>
        </DialogHeader>

        <div className='grid grid-cols-1 gap-6 py-4 md:grid-cols-2 lg:grid-cols-3'>
          {showAccountFilter && (
            <div className='space-y-2'>
              <label className='flex items-center gap-2 text-sm font-medium'>
                <Icon name='building' className='h-4 w-4' />
                Account
              </label>
              <Select
                onValueChange={(value) =>
                  setTempFilters((prev) => ({
                    ...prev,
                    accountId: value === 'all' ? undefined : value
                  }))
                }
                value={tempFilters.accountId || 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Accounts' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Accounts</SelectItem>
                  {isLoadingAccounts ? (
                    <SelectItem value='loading' disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <Icon name='tag' className='h-4 w-4' />
              Category
            </label>
            <CategoryCombobox
              value={tempFilters.categoryId}
              onChange={(value) => setTempFilters((prev) => ({ ...prev, categoryId: value }))}
              allowClear={true}
              placeholder='All Categories'
            />
          </div>

          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <Icon name='type' className='h-4 w-4' />
              Type
            </label>
            <Select
              onValueChange={(value) =>
                setTempFilters((prev) => ({
                  ...prev,
                  isIncome: value === 'all' ? undefined : value === 'true'
                }))
              }
              value={tempFilters.isIncome === undefined ? 'all' : String(tempFilters.isIncome)}
            >
              <SelectTrigger>
                <SelectValue placeholder='All Types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='true'>Income</SelectItem>
                <SelectItem value='false'>Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <Icon name='calendar' className='h-4 w-4' />
              Date Range
            </label>
            <DateRangePickerV2
              date={tempFilters.dateRange}
              onDateChange={(dateRange) => setTempFilters((prev) => ({ ...prev, dateRange }))}
              onClear={() => setTempFilters((prev) => ({ ...prev, dateRange: undefined }))}
              closeOnComplete={true}
              noLabel
              minDate={
                transactionsData?.dateRange?.minDate
                  ? new Date(transactionsData.dateRange.minDate)
                  : undefined
              }
              maxDate={
                transactionsData?.dateRange?.maxDate
                  ? new Date(transactionsData.dateRange.maxDate)
                  : undefined
              }
              isOnModal
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Min Amount</label>
            <Input
              type='number'
              placeholder='Minimum amount'
              value={tempFilters.minAmount || ''}
              onChange={(e) =>
                setTempFilters((prev) => ({
                  ...prev,
                  minAmount: Number(e.target.value) || undefined
                }))
              }
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Max Amount</label>
            <Input
              type='number'
              placeholder='Maximum amount'
              value={tempFilters.maxAmount || ''}
              onChange={(e) =>
                setTempFilters((prev) => ({
                  ...prev,
                  maxAmount: Number(e.target.value) || undefined
                }))
              }
            />
          </div>

          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <Icon name='settings2' className='h-4 w-4' />
              Transaction Type
            </label>
            <Select
              onValueChange={(value) => setTempFilters((prev) => ({ ...prev, type: value as any }))}
              value={tempFilters.type || 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='normal'>Normal</SelectItem>
                <SelectItem value='recurring'>Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className='flex gap-2'>
          <Button variant='outline' onClick={handleClear}>
            Clear All
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
