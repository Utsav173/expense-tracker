'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DateRangePicker from '../date-range-picker';
import React from 'react';
import { Category } from '@/lib/types';
import { format } from 'date-fns';

interface AccountFiltersProps {
  filters: any;
  setSearchQuery: (value: string) => void;
  handleCategoryChange: (value: string) => void;
  handleIncomeTypeChange: (value: string) => void;
  handleDateRangeSelect: (range: any) => void;
  handleClearDateRange: () => void;
  handleResetFilters: () => void;
  categories: { categories: Category[] } | undefined;
}

export const AccountFilters: React.FC<AccountFiltersProps> = ({
  filters,
  setSearchQuery,
  handleCategoryChange,
  handleIncomeTypeChange,
  handleDateRangeSelect,
  handleClearDateRange,
  handleResetFilters,
  categories
}) => {
  const selectedDateRangeLabel = React.useMemo(() => {
    if (!filters.dateRange?.from || !filters.dateRange.to) return 'This Month';
    return `${format(filters.dateRange.from, 'MMM dd, yyyy')} - ${format(
      filters.dateRange.to,
      'MMM dd, yyyy'
    )}`;
  }, [filters.dateRange]);

  return (
    <div className='mb-4 space-y-4'>
      <div className='w-full'>
        <Input
          type='text'
          placeholder='Search transactions...'
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full'
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='md:col-span-2 lg:col-span-1'>
          <DateRangePicker dateRange={filters.tempDateRange} setDateRange={handleDateRangeSelect} />
        </div>

        <div>
          <Select value={filters.categoryId || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Category' />
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

        <div>
          <Select
            value={filters.isIncome === undefined ? 'all' : String(filters.isIncome)}
            onValueChange={handleIncomeTypeChange}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='true'>Income</SelectItem>
              <SelectItem value='false'>Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-wrap items-center gap-2 md:col-span-2 lg:col-span-1'>
          {filters.dateRange?.from && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClearDateRange}
              className='flex-grow sm:flex-grow-0'
            >
              Clear
            </Button>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={handleResetFilters}
            className='flex-grow sm:flex-grow-0'
          >
            Reset Filters
          </Button>
        </div>
      </div>
      <span className='text-sm text-gray-500'>{selectedDateRangeLabel}</span>
    </div>
  );
};
