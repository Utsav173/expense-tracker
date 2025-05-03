'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import TransactionTable from '@/components/transactions-table';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Category, Transaction } from '@/lib/types';
import { DateRange } from 'react-day-picker';

interface AccountTransactionsSectionProps {
  transactionsData?: {
    transactions: Transaction[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
    filters: {
      sortBy: string;
      sortOrder: string;
      q: string;
    };
    dateRange: {
      minDate: string;
      maxDate: string;
    };
  };
  isTransactionLoading?: boolean;
  filters: {
    searchQuery: string;
    debouncedSearchQuery: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    categoryId?: string;
    isIncome?: boolean;
    dateRange?: DateRange;
    tempDateRange?: DateRange;
  };
  handleSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  page: number;
  handlePageChange: (page: number) => void;
  categories?: { categories: Category[]; pagination: any };
  setSearchQuery: (query: string) => void;
  handleCategoryChange: (categoryId: string) => void;
  handleIncomeTypeChange: (type: string) => void;
  handleDateRangeSelect: (range: any) => void;
  handleClearDateRange: () => void;
  handleResetFilters: () => void;
  refetchData: () => Promise<void>;
  isOwner?: boolean;
}

export const AccountTransactionsSection = ({
  transactionsData,
  isTransactionLoading,
  filters,
  handleSort,
  page,
  handlePageChange,
  categories,
  setSearchQuery,
  handleCategoryChange,
  handleIncomeTypeChange,
  handleDateRangeSelect,
  handleClearDateRange,
  handleResetFilters,
  refetchData,
  isOwner = true
}: AccountTransactionsSectionProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className='flex h-full flex-col'>
      <div className='border-b p-4'>
        <div className='flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search transactions...'
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-accent')}
          >
            <Filter className='h-4 w-4' />
          </Button>
        </div>

        {showFilters && (
          <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {isOwner && (
              <div className='space-y-1'>
                <label className='mb-1 block text-xs font-medium sm:text-sm'>Category</label>
                <Select onValueChange={handleCategoryChange} value={filters.categoryId || 'all'}>
                  <SelectTrigger className='h-9 w-full text-xs sm:h-10 sm:text-sm'>
                    <SelectValue placeholder='All Categories' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Categories</SelectItem>
                    {categories?.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isOwner && (
              <div className='space-y-1'>
                <label className='mb-1 block text-xs font-medium sm:text-sm'>Type</label>
                <Select
                  onValueChange={handleIncomeTypeChange}
                  value={filters.isIncome ? 'income' : 'expense'}
                >
                  <SelectTrigger className='h-9 w-full text-xs sm:h-10 sm:text-sm'>
                    <SelectValue placeholder='All Types' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value='income'>Income</SelectItem>
                    <SelectItem value='expense'>Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Date Range</label>
              <DateRangePickerV2
                onDateChange={handleDateRangeSelect}
                onClear={handleClearDateRange}
                date={filters.dateRange}
                closeOnComplete={true}
                buttonClassName='h-full'
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
              />
            </div>

            {isOwner && (
              <div className='mt-5 flex items-center max-sm:mt-0 max-sm:items-end'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleResetFilters}
                  className='flex w-full items-center gap-2'
                >
                  <X className='h-4 w-4' />
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <ScrollArea className='flex-1'>
        {isTransactionLoading ? (
          <div className='space-y-4 p-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='flex items-center justify-between'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-[200px]' />
                  <Skeleton className='h-3 w-[150px]' />
                </div>
                <Skeleton className='h-4 w-[100px]' />
              </div>
            ))}
          </div>
        ) : transactionsData?.transactions.length === 0 ? (
          <div className='text-muted-foreground flex h-full items-center justify-center p-8 text-center'>
            No transactions found for the selected filters.
            {Object.keys(filters).length > 0 && isOwner && (
              <Button variant='link' className='ml-1' onClick={handleResetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <TransactionTable
            transactions={transactionsData?.transactions ?? []}
            onSort={handleSort}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            loading={isTransactionLoading ?? false}
            totalRecords={transactionsData?.pagination.total ?? 0}
            page={page}
            handlePageChange={handlePageChange}
            refetchData={async () => {
              await refetchData();
            }}
            isOwner={isOwner}
          />
        )}
      </ScrollArea>
    </div>
  );
};

export default AccountTransactionsSection;
