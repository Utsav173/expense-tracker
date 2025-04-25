'use client';

import React from 'react';
import TransactionTable from '../transactions-table';
import { Skeleton } from '../ui/skeleton';
import { AccountFilters } from './account-filters';
import { Category, TransactionsResponse } from '@/lib/types';

interface AccountTransactionsSectionProps {
  transactionsData: TransactionsResponse | undefined;
  isTransactionLoading: boolean;
  filters: any;
  handleSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  page: number;
  handlePageChange: (page: number) => void;
  categories: { categories: Category[] } | undefined;
  setSearchQuery: (value: string) => void;
  handleCategoryChange: (value: string) => void;
  handleIncomeTypeChange: (value: string) => void;
  handleDateRangeSelect: (range: any) => void;
  handleClearDateRange: () => void;
  handleResetFilters: () => void;
  refetchData: () => Promise<void>;
}

export const AccountTransactionsSection: React.FC<AccountTransactionsSectionProps> = ({
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
}) => {
  return (
    <section className='rounded-xl bg-white shadow-xs'>
      <div className='flex items-center justify-between border-b p-6'>
        <h2 className='text-xl font-semibold'>Transactions</h2>
      </div>

      <div className='p-6'>
        <AccountFilters
          filters={filters}
          setSearchQuery={setSearchQuery}
          handleCategoryChange={handleCategoryChange}
          handleIncomeTypeChange={handleIncomeTypeChange}
          handleDateRangeSelect={handleDateRangeSelect}
          handleClearDateRange={handleClearDateRange}
          handleResetFilters={handleResetFilters}
          categories={categories}
        />

        {isTransactionLoading ? (
          <div className='space-y-4'>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className='h-16' />
              ))}
          </div>
        ) : !transactionsData?.transactions?.length ? (
          <div className='py-8 text-center text-gray-500'>
            No transactions found for the selected filters.
          </div>
        ) : (
          <TransactionTable
            transactions={transactionsData.transactions}
            onSort={handleSort}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            loading={isTransactionLoading}
            totalRecords={transactionsData.totalCount}
            page={page}
            handlePageChange={handlePageChange}
            refetchData={refetchData}
            key={'account-transactions'}
          />
        )}
      </div>
    </section>
  );
};
