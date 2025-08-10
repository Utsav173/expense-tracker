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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Download, Loader2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryAPI, TransactionAPI } from '@/lib/api/api-types';
import { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';
import { useToast } from '@/lib/hooks/useToast';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '../ui/label';

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AccountTransactionsSectionProps['filters'];
  categories?: { categories: CategoryAPI.Category[]; pagination: any };
  isOwner?: boolean;
  handleCategoryChange: (categoryId: string) => void;
  handleIncomeTypeChange: (type: string) => void;
  handleDateRangeSelect: (range: any) => void;
  handleClearDateRange: () => void;
  handleAmountChange: (min?: number, max?: number) => void;
  handleTypeChange: (type: 'all' | 'recurring' | 'normal') => void;
  handleResetFilters: () => void;
  transactionsData: AccountTransactionsSectionProps['transactionsData'];
  activeFiltersCount: number;
}

// Enhanced Filter Dialog Component
const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onOpenChange,
  filters,
  categories,
  isOwner,
  handleCategoryChange,
  handleIncomeTypeChange,
  handleDateRangeSelect,
  handleClearDateRange,
  handleAmountChange,
  handleTypeChange,
  handleResetFilters,
  transactionsData,
  activeFiltersCount
}) => {
  const handleApplyAndClose = () => {
    onOpenChange(false);
  };

  const handleReset = () => {
    handleResetFilters();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Settings2 className='h-5 w-5' />
            Filter Transactions
          </DialogTitle>
          <DialogDescription>
            Refine your transaction search with advanced filters
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Transaction Filters Section */}
          {isOwner && (
            <div className='space-y-4'>
              <h4 className='text-foreground text-sm font-semibold'>Transaction Filters</h4>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Category Filter */}
                <div className='space-y-2'>
                  <label className='text-muted-foreground text-sm font-medium'>Category</label>
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

                {/* Income/Expense Type Filter */}
                <div className='space-y-2'>
                  <label className='text-muted-foreground text-sm font-medium'>
                    Income/Expense Type
                  </label>
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

                {/* Transaction Type Filter */}
                <div className='space-y-2 md:col-span-2'>
                  <label className='text-muted-foreground text-sm font-medium'>
                    Transaction Type
                  </label>
                  <Select onValueChange={handleTypeChange} value={filters.type || 'all'}>
                    <SelectTrigger className='md:w-1/2'>
                      <SelectValue placeholder='All Transaction Types' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All</SelectItem>
                      <SelectItem value='normal'>Normal</SelectItem>
                      <SelectItem value='recurring'>Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Date Range Section */}
          <div className='space-y-4'>
            <h4 className='text-foreground text-sm font-semibold'>Date Range</h4>
            <div className='space-y-2'>
              <label className='text-muted-foreground text-sm font-medium'>Select Date Range</label>
              <DateRangePickerV2
                onDateChange={handleDateRangeSelect}
                onClear={handleClearDateRange}
                date={filters.dateRange}
                closeOnComplete
                buttonClassName='w-full md:w-auto'
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
          </div>

          <Separator />

          {/* Amount Range Section */}
          <div className='space-y-4'>
            <h4 className='text-foreground text-sm font-semibold'>Amount Range</h4>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-muted-foreground text-sm font-medium'>Minimum Amount</label>
                <Input
                  type='number'
                  placeholder='0.00'
                  value={filters.minAmount || ''}
                  onChange={(e) =>
                    handleAmountChange(Number(e.target.value) || undefined, filters.maxAmount)
                  }
                />
              </div>
              <div className='space-y-2'>
                <label className='text-muted-foreground text-sm font-medium'>Maximum Amount</label>
                <Input
                  type='number'
                  placeholder='∞'
                  value={filters.maxAmount || ''}
                  onChange={(e) =>
                    handleAmountChange(filters.minAmount, Number(e.target.value) || undefined)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='flex-col gap-2 sm:flex-row'>
          <Button
            variant='outline'
            onClick={handleReset}
            className='w-full sm:w-auto'
            disabled={activeFiltersCount === 0}
          >
            <X className='mr-2 h-4 w-4' />
            Reset All Filters
          </Button>
          <Button onClick={handleApplyAndClose} className='w-full sm:w-auto'>
            Apply Filters
            {activeFiltersCount > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Export Dialog Component
interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportFormat: 'xlsx' | 'csv';
  setExportFormat: (format: 'xlsx' | 'csv') => void;
  handleExport: () => void;
  isExporting: boolean;
  transactionsCount: number;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  exportFormat,
  setExportFormat,
  handleExport,
  isExporting,
  transactionsCount
}) => {
  const handleExportAndClose = () => {
    handleExport();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            Export Transactions
          </DialogTitle>
          <DialogDescription>
            Export {transactionsCount} transaction{transactionsCount !== 1 ? 's' : ''} in your
            preferred format
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2 py-2'>
          <div>
            <Label className='text-muted-foreground mb-2 text-sm font-medium'>Export Format</Label>
          </div>
          <Select
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as 'xlsx' | 'csv')}
            disabled={isExporting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='xlsx'>
                <div className='flex flex-col items-start'>
                  <span>Excel (.xlsx)</span>
                  <span className='text-muted-foreground text-xs'>Best for detailed analysis</span>
                </div>
              </SelectItem>
              <SelectItem value='csv'>
                <div className='flex flex-col items-start'>
                  <span>CSV (.csv)</span>
                  <span className='text-muted-foreground text-xs'>Universal compatibility</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExportAndClose} disabled={isExporting || transactionsCount === 0}>
            {isExporting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Exporting...
              </>
            ) : (
              <>
                <Download className='mr-2 h-4 w-4' />
                Export Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AccountTransactionsSectionProps {
  transactionsData?: TransactionAPI.GetTransactionsResponse;
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
  categories?: { categories: CategoryAPI.Category[]; pagination: any };
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
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const { showError, showSuccess, showInfo } = useToast();

  // Calculate active filters count for better UX
  const activeFiltersCount = [
    filters.categoryId && filters.categoryId !== 'all',
    filters.isIncome !== undefined,
    filters.dateRange?.from || filters.dateRange?.to,
    filters.minAmount,
    filters.maxAmount,
    filters.type && filters.type !== 'all'
  ].filter(Boolean).length;

  // Generate active filter badges
  const getActiveFilterBadges = () => {
    const badges = [];

    if (filters.categoryId && filters.categoryId !== 'all') {
      const category = categories?.categories.find((c) => c.id === filters.categoryId);
      badges.push({
        key: 'category',
        label: category?.name || 'Category',
        onRemove: () => handleCategoryChange('all')
      });
    }

    if (filters.isIncome !== undefined) {
      badges.push({
        key: 'income',
        label: filters.isIncome ? 'Income' : 'Expense',
        onRemove: () => handleIncomeTypeChange('all')
      });
    }

    if (filters.dateRange?.from || filters.dateRange?.to) {
      badges.push({
        key: 'date',
        label: 'Date Range',
        onRemove: handleClearDateRange
      });
    }

    if (filters.minAmount || filters.maxAmount) {
      badges.push({
        key: 'amount',
        label: 'Amount Range',
        onRemove: () => handleAmountChange(undefined, undefined)
      });
    }

    if (filters.type && filters.type !== 'all') {
      badges.push({
        key: 'type',
        label: filters.type === 'recurring' ? 'Recurring' : 'Normal',
        onRemove: () => handleTypeChange('all')
      });
    }

    return badges;
  };

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

  const activeFilterBadges = getActiveFilterBadges();

  return (
    <div className='flex h-auto flex-col'>
      {/* Header Section with Search and Actions */}
      <div className='mb-6 space-y-4'>
        {/* Search and Action Bar */}
        <div className='flex items-center gap-3'>
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
            onClick={() => setShowFilterDialog(true)}
            className={cn(
              'relative gap-2',
              activeFiltersCount > 0 && 'border-primary text-primary'
            )}
          >
            <Filter className='h-4 w-4' />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant='secondary' className='ml-1 h-5 px-1.5 text-xs'>
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <Button
            variant='outline'
            onClick={() => setShowExportDialog(true)}
            disabled={!transactionsData?.transactions?.length || isTransactionLoading}
            className='gap-2'
          >
            <Download className='h-4 w-4' />
            Export
          </Button>
        </div>

        {/* Active Filters Display */}
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
                  <X className='h-3 w-3' />
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

      {/* Transactions Table or Empty State */}
      {transactionsData?.transactions.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='text-muted-foreground mb-4'>
              <Search className='mx-auto mb-4 h-12 w-12 opacity-50' />
              <h3 className='mb-2 text-lg font-semibold'>No transactions found</h3>
              <p className='text-sm'>
                {activeFiltersCount > 0
                  ? 'Try adjusting your filters to see more results'
                  : 'No transactions available for this account'}
              </p>
            </div>
            {activeFiltersCount > 0 && isOwner && (
              <Button variant='outline' onClick={handleResetFilters}>
                <X className='mr-2 h-4 w-4' />
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

      {/* Filter Dialog */}
      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        filters={filters}
        categories={categories}
        isOwner={isOwner}
        handleCategoryChange={handleCategoryChange}
        handleIncomeTypeChange={handleIncomeTypeChange}
        handleDateRangeSelect={handleDateRangeSelect}
        handleClearDateRange={handleClearDateRange}
        handleAmountChange={handleAmountChange}
        handleTypeChange={handleTypeChange}
        handleResetFilters={handleResetFilters}
        transactionsData={transactionsData}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        handleExport={handleExport}
        isExporting={isExporting}
        transactionsCount={transactionsData?.transactions?.length || 0}
      />
    </div>
  );
};

export default AccountTransactionsSection;
