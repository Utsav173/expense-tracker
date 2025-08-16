'use client';

import { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TransactionTable from '@/components/transactions/transactions-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '../ui/icon';
import {
  FilterState,
  TransactionFilterDialog
} from '@/components/transactions/transaction-filter-dialog';
import { useAccountDetails } from './context/account-details-context';

interface AccountTransactionsSectionProps {
  isOwner?: boolean;
}

export const AccountTransactionsSection = ({ isOwner = true }: AccountTransactionsSectionProps) => {
  const {
    transactionsData,
    isTransactionLoading,
    filters,
    handleSort,
    page,
    handlePageChange,
    categories,
    setSearchQuery,
    refetchData,
    setState
  } = useAccountDetails();

  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const handleApplyFilters = (newFilters: Partial<FilterState>) => {
    setState({ page: 1, ...newFilters });
  };

  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.categoryId) active.push('category');
    if (filters.isIncome !== undefined) active.push('type');
    if (filters.dateFrom || filters.dateTo) active.push('dateRange');
    if (filters.minAmount || filters.maxAmount) active.push('amount');
    if (filters.type && filters.type !== 'all') active.push('transactionType');
    return active;
  }, [filters]);

  const activeFilterBadges = useMemo(() => {
    const badges = [];
    if (filters.categoryId) {
      const category = categories?.categories.find((c) => c.id === filters.categoryId);
      badges.push({
        key: 'category',
        label: category?.name || 'Category',
        onRemove: () => setState({ categoryId: undefined })
      });
    }
    if (filters.isIncome !== undefined) {
      badges.push({
        key: 'isIncome',
        label: filters.isIncome ? 'Income' : 'Expense',
        onRemove: () => setState({ isIncome: undefined })
      });
    }
    if (filters.dateFrom || filters.dateTo) {
      badges.push({
        key: 'date',
        label: 'Date Range',
        onRemove: () => setState({ dateFrom: undefined, dateTo: undefined })
      });
    }
    if (filters.minAmount || filters.maxAmount) {
      badges.push({
        key: 'amount',
        label: 'Amount Range',
        onRemove: () => setState({ minAmount: undefined, maxAmount: undefined })
      });
    }
    if (filters.type && filters.type !== 'all') {
      badges.push({
        key: 'type',
        label: filters.type === 'recurring' ? 'Recurring' : 'Normal',
        onRemove: () => setState({ type: 'all' })
      });
    }
    return badges;
  }, [filters, categories, setState]);

  const handleResetFilters = () => {
    setState({
      categoryId: undefined,
      isIncome: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      type: 'all',
      q: '',
      page: 1
    });
    setSearchQuery('');
  };

  return (
    <div className='flex h-auto flex-col'>
      <div className='mb-6 space-y-4'>
        <div className='flex items-center gap-3'>
          <div className='relative flex-1'>
            <Icon
              name='search'
              className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
            />
            <Input
              placeholder='Search transactions...'
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
          <Button
            variant='outline'
            onClick={() => setShowFilterDialog(true)}
            className={cn(
              'relative gap-2',
              activeFilters.length > 0 && 'border-primary text-primary'
            )}
          >
            <Icon name='filter' className='h-4 w-4' />
            Filters
            {activeFilters.length > 0 && (
              <Badge variant='secondary' className='ml-1 h-5 px-1.5 text-xs'>
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </div>
        {activeFilterBadges.length > 0 && (
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-muted-foreground text-sm'>Applied filters:</span>
            {activeFilterBadges.map((badge) => (
              <Badge key={badge.key} variant='secondary' className='gap-1 pr-1'>
                {badge.label}
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0.5 hover:bg-transparent'
                  onClick={badge.onRemove}
                >
                  <Icon name='x' className='h-3 w-3' />
                </Button>
              </Badge>
            ))}
            {isOwner && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleResetFilters}
                className='text-muted-foreground hover:text-foreground h-6 text-xs'
              >
                Clear all
              </Button>
            )}
          </div>
        )}
      </div>

      {transactionsData?.transactions.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='text-muted-foreground mb-4'>
              <Icon name='search' className='mx-auto mb-4 h-12 w-12 opacity-50' />
              <h3 className='mb-2 text-lg font-semibold'>No transactions found</h3>
              <p className='text-sm'>
                {activeFilters.length > 0
                  ? 'Try adjusting your filters to see more results'
                  : 'No transactions available for this account'}
              </p>
            </div>
            {activeFilters.length > 0 && isOwner && (
              <Button variant='outline' onClick={handleResetFilters}>
                <Icon name='x' className='mr-2 h-4 w-4' />
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <TransactionTable
          tableId='account-transactions-table'
          transactions={transactionsData?.transactions ?? []}
          onSort={handleSort}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          loading={isTransactionLoading ?? false}
          totalRecords={transactionsData?.pagination.total ?? 0}
          page={page}
          handlePageChange={handlePageChange}
          refetchData={refetchData}
          isOwner={isOwner}
        />
      )}

      <TransactionFilterDialog
        isOpen={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        activeFilters={filters}
        onApplyFilters={handleApplyFilters}
        accounts={undefined}
        isLoadingAccounts={false}
        transactionsData={transactionsData}
        showAccountFilter={false}
      />
    </div>
  );
};

export default AccountTransactionsSection;
