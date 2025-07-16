'use client';
import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TransactionTable from '@/components/transactions/transactions-table';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Search, Filter, X, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category, Transaction } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';
import { useToast } from '@/lib/hooks/useToast';
import { Card, CardContent } from '@/components/ui/card';

// Props for the new Filter Component
interface AccountTransactionFiltersProps {
  filters: AccountTransactionsSectionProps['filters'];
  categories?: { categories: Category[]; pagination: any };
  isOwner?: boolean;
  isExporting: boolean;
  exportFormat: 'xlsx' | 'csv';
  setExportFormat: (format: 'xlsx' | 'csv') => void;
  handleCategoryChange: (categoryId: string) => void;
  handleIncomeTypeChange: (type: string) => void;
  handleDateRangeSelect: (range: any) => void;
  handleClearDateRange: () => void;
  handleAmountChange: (min?: number, max?: number) => void;
  handleTypeChange: (type: 'all' | 'recurring' | 'normal') => void;
  handleResetFilters: () => void;
  handleExport: () => void;
  transactionsData: AccountTransactionsSectionProps['transactionsData'];
  isTransactionLoading?: boolean;
}

// The new dedicated Filter Component
const AccountTransactionFilters: React.FC<AccountTransactionFiltersProps> = ({
  filters,
  categories,
  isOwner,
  isExporting,
  exportFormat,
  setExportFormat,
  handleCategoryChange,
  handleIncomeTypeChange,
  handleDateRangeSelect,
  handleClearDateRange,
  handleAmountChange,
  handleTypeChange,
  handleResetFilters,
  handleExport,
  transactionsData,
  isTransactionLoading
}) => (
  <Card className='mt-4 p-4'>
    <CardContent className='p-0'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
        {/* Category Filter */}
        {isOwner && (
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Category</label>
            <Select onValueChange={handleCategoryChange} value={filters.categoryId || 'all'}>
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
          </div>
        )}

        {/* Income/Expense Type Filter */}
        {isOwner && (
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Type</label>
            <Select
              onValueChange={handleIncomeTypeChange}
              value={filters.isIncome === undefined ? 'all' : String(filters.isIncome)}
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
        )}

        {/* Date Range Filter */}
        <div className='space-y-1.5'>
          <label className='text-sm font-medium'>Date Range</label>
          <DateRangePickerV2
            onDateChange={handleDateRangeSelect}
            onClear={handleClearDateRange}
            date={filters.dateRange}
            closeOnComplete
            buttonClassName='w-full'
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

        {/* Amount Filters */}
        <div className='grid grid-cols-2 gap-2'>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Min Amount</label>
            <Input
              type='number'
              placeholder='Min'
              value={filters.minAmount || ''}
              onChange={(e) =>
                handleAmountChange(Number(e.target.value) || undefined, filters.maxAmount)
              }
            />
          </div>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium'>Max Amount</label>
            <Input
              type='number'
              placeholder='Max'
              value={filters.maxAmount || ''}
              onChange={(e) =>
                handleAmountChange(filters.minAmount, Number(e.target.value) || undefined)
              }
            />
          </div>
        </div>

        {/* Transaction Type Filter */}
        <div className='space-y-1.5'>
          <label className='text-sm font-medium'>Transaction Type</label>
          <Select onValueChange={handleTypeChange} value={filters.type || 'all'}>
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

        {/* Export Controls */}
        <div className='space-y-1.5'>
          <label className='text-sm font-medium'>Export Format</label>
          <Select
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as 'xlsx' | 'csv')}
            disabled={isExporting}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select Format' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='xlsx'>Excel (.xlsx)</SelectItem>
              <SelectItem value='csv'>CSV (.csv)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className='flex items-end gap-2'>
          {isOwner && (
            <Button variant='ghost' size='sm' onClick={handleResetFilters} className='w-full'>
              <X className='mr-2 h-4 w-4' /> Reset
            </Button>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={handleExport}
            disabled={
              isExporting || isTransactionLoading || !transactionsData?.transactions?.length
            }
            className='w-full'
          >
            {isExporting ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Download className='mr-2 h-4 w-4' />
            )}
            Export
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

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
    accountId?: string;
    minAmount?: number;
    maxAmount?: number;
    type?: 'all' | 'recurring' | 'normal';
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
  handleAmountChange: (min?: number, max?: number) => void;
  handleTypeChange: (type: 'all' | 'recurring' | 'normal') => void;
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
  isOwner = true,
  handleAmountChange,
  handleTypeChange
}: AccountTransactionsSectionProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const { showError, showSuccess, showInfo } = useToast();

  const handleExport = useCallback(() => {
    if (!transactionsData?.transactions || transactionsData.transactions.length === 0) {
      showError('No transactions available to export with the current filters.');
      return;
    }
    setIsExporting(true);
    showInfo('Preparing your export...');
    try {
      const transactions = transactionsData.transactions;
      const exportData = transactions.map((tx) => ({
        ...tx,
        category:
          typeof tx.category === 'object' && tx.category?.name ? tx.category.name : tx.category
      }));
      if (exportFormat === 'csv') {
        const headers = Object.keys(exportData[0] || {});
        const csvRows = [headers.join(',')];
        for (const tx of exportData) {
          csvRows.push(headers.map((h) => JSON.stringify((tx as any)[h] ?? '')).join(','));
        }
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showSuccess('CSV export started successfully!');
      } else {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
        XLSX.writeFile(wb, 'transactions.xlsx');
        showSuccess('Excel export started successfully!');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      showError(error.message || 'Failed to export transactions.');
    } finally {
      setIsExporting(false);
    }
  }, [transactionsData?.transactions, exportFormat, showError, showSuccess, showInfo]);

  return (
    <div className='flex h-auto flex-col'>
      <div className='mb-4 border-b py-4 max-sm:mb-4'>
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
            className={cn('h-9 w-9 shrink-0', showFilters && 'bg-accent')}
            aria-label={showFilters ? 'Hide Filters' : 'Show Filters'}
          >
            <Filter className='h-4 w-4' />
          </Button>
        </div>

        {showFilters && (
          <AccountTransactionFilters
            filters={filters}
            categories={categories}
            isOwner={isOwner}
            isExporting={isExporting}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            handleCategoryChange={handleCategoryChange}
            handleIncomeTypeChange={handleIncomeTypeChange}
            handleDateRangeSelect={handleDateRangeSelect}
            handleClearDateRange={handleClearDateRange}
            handleAmountChange={handleAmountChange}
            handleTypeChange={handleTypeChange}
            handleResetFilters={handleResetFilters}
            handleExport={handleExport}
            transactionsData={transactionsData}
            isTransactionLoading={isTransactionLoading}
          />
        )}
      </div>

      {transactionsData?.transactions.length === 0 ? (
        <div className='text-muted-foreground flex h-auto items-center justify-center p-8 text-center'>
          No transactions found for the selected filters.
          {Object.values(filters).some(
            (val) => val !== undefined && val !== '' && val !== 'createdAt' && val !== 'desc'
          ) &&
            isOwner && (
              <Button variant='link' className='ml-1' onClick={handleResetFilters}>
                Clear filters
              </Button>
            )}
        </div>
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
    </div>
  );
};

export default AccountTransactionsSection;
