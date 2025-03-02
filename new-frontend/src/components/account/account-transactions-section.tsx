'use client';

import React from 'react';
import TransactionTable from '../transactions-table';
import { Skeleton } from '../ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '../ui/pagination';
import { AccountFilters } from './account-filters';
import { Category, Transaction } from '@/lib/types';

interface AccountTransactionsSectionProps {
  transactionsData:
    | { transactions: Transaction[]; totalPages: number; currentPage: number }
    | undefined;
  isTransactionLoading: boolean;
  refetchTransactions: () => void;
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
}

export const AccountTransactionsSection: React.FC<AccountTransactionsSectionProps> = ({
  transactionsData,
  isTransactionLoading,
  refetchTransactions,
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
  handleResetFilters
}) => {
  return (
    <section className='rounded-xl bg-white shadow-sm'>
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
          <>
            <TransactionTable
              transactions={transactionsData.transactions}
              onUpdate={refetchTransactions}
              onSort={handleSort}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
            />
            {transactionsData.totalPages > 1 ? (
              <Pagination className='mt-6'>
                <PaginationContent>
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href='#' onClick={() => handlePageChange(page - 1)} />
                    </PaginationItem>
                  )}
                  {Array.from({ length: transactionsData.totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p <= 2 || p >= transactionsData.totalPages - 1 || Math.abs(p - page) <= 1
                    )
                    .map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href='#'
                          isActive={p === page}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  {page < transactionsData.totalPages && (
                    <PaginationItem>
                      <PaginationNext href='#' onClick={() => handlePageChange(page + 1)} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
};
