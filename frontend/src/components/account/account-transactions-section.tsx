'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import TransactionTable from '@/components/transactions-table';
import DateRangePickerV2 from '@/components/date-range-picker-v2';
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
    totalPages: number;
    totalCount: number;
    currentPage: number;
    pageSize: number;
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
  refetchData
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
          <div className='mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3'>
            <Select value={filters.categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger>
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

            <Select
              value={filters.isIncome?.toString() ?? 'all'}
              onValueChange={handleIncomeTypeChange}
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

            <DateRangePickerV2
              date={filters.dateRange}
              onDateChange={handleDateRangeSelect}
              onClear={handleClearDateRange}
              noLabel
            />

            <Button
              variant='outline'
              size='sm'
              onClick={handleResetFilters}
              className='flex items-center gap-2 sm:col-span-3'
            >
              <X className='h-4 w-4' />
              Reset Filters
            </Button>
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
            No transactions found.
            {Object.keys(filters).length > 0 && (
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
            totalRecords={transactionsData?.totalCount ?? 0}
            page={page}
            handlePageChange={handlePageChange}
            refetchData={async () => {
              await refetchData();
            }}
          />
        )}
      </ScrollArea>
    </div>
  );
};

export default AccountTransactionsSection;
