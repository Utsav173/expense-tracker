'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { AIAPI } from '@/lib/api/api-types';
import { transactionBulkCreate } from '@/lib/endpoints/transactions';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { Label } from '../ui/label';
import { NumericInput } from '../ui/numeric-input';
import { Icon } from '../ui/icon';
import { Checkbox } from '@/components/ui/checkbox';

type EditableTransaction = AIAPI.ExtractedTransaction & { id: string };

interface TransactionItemProps {
  transaction: EditableTransaction;
  onFieldChange: (id: string, field: keyof AIAPI.ExtractedTransaction, value: any) => void;
  onRemove: (id: string) => void;
  currency: string;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onFieldChange,
  onRemove,
  currency,
  isSelected,
  onSelectToggle
}) => {
  const isIncome = transaction.credit !== undefined;

  return (
    <div
      className={cn(
        'bg-background relative rounded-lg border p-3 transition-shadow hover:shadow-md',
        !isSelected && 'opacity-60'
      )}
    >
      <div className='flex items-start gap-3'>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectToggle(transaction.id)}
          className='mt-1.5 shrink-0'
          aria-label='Select transaction'
        />
        <div
          className={cn(
            'mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
            isIncome ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          )}
        >
          <Icon name={isIncome ? 'arrowUpCircle' : 'arrowDownCircle'} className='h-4 w-4' />
        </div>
        <div className='flex-1 space-y-2'>
          <Input
            value={transaction.description}
            onChange={(e) => onFieldChange(transaction.id, 'description', e.target.value)}
            placeholder='Description'
            className='focus:border-input h-auto border-0 border-b border-transparent p-0 text-base font-medium focus:ring-0'
          />
          <div className='flex items-center justify-between'>
            <Input
              value={transaction.category}
              onChange={(e) => onFieldChange(transaction.id, 'category', e.target.value)}
              placeholder='Category'
              className='text-muted-foreground focus:border-input h-auto border-0 border-b border-transparent p-0 text-xs focus:ring-0'
            />
            <Input
              value={transaction.date}
              onChange={(e) => onFieldChange(transaction.id, 'date', e.target.value)}
              placeholder='YYYY-MM-DD'
              className='text-muted-foreground focus:border-input h-auto w-[90px] border-0 border-b border-transparent p-0 text-right text-xs focus:ring-0'
            />
          </div>
          <div className='flex items-center justify-end gap-2'>
            <NumericInput
              value={isIncome ? transaction.credit : transaction.debit}
              onValueChange={({ value }: { value: string }) => {
                const amount = parseFloat(value);
                if (isIncome) {
                  onFieldChange(transaction.id, 'credit', amount);
                } else {
                  onFieldChange(transaction.id, 'debit', amount);
                }
              }}
              className='focus:border-input h-auto border-0 border-b border-transparent p-0 text-right text-lg font-bold focus:ring-0'
              prefix={`${currency} `}
            />
            <Select
              value={isIncome ? 'income' : 'expense'}
              onValueChange={(value) => {
                const amount = transaction.credit ?? transaction.debit ?? 0;
                if (value === 'income') {
                  onFieldChange(transaction.id, 'credit', amount);
                  onFieldChange(transaction.id, 'debit', undefined);
                } else {
                  onFieldChange(transaction.id, 'debit', amount);
                  onFieldChange(transaction.id, 'credit', undefined);
                }
              }}
            >
              <SelectTrigger className='h-8 w-[110px] text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='income'>Income</SelectItem>
                <SelectItem value='expense'>Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

const AiTransactionPreview: React.FC<{ transactions: AIAPI.ExtractedTransaction[] }> = ({
  transactions
}) => {
  const [editableTransactions, setEditableTransactions] = useState<EditableTransaction[]>(() =>
    transactions.map((tx) => ({ ...tx, id: crypto.randomUUID() }))
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(editableTransactions.map((tx) => tx.id))
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const selectedAccountCurrency = useMemo(() => {
    return accounts?.find((acc) => acc.id === selectedAccountId)?.currency || 'INR';
  }, [selectedAccountId, accounts]);

  const handleFieldChange = useCallback(
    (id: string, field: keyof AIAPI.ExtractedTransaction, value: any) => {
      setEditableTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, [field]: value } : tx))
      );
    },
    []
  );

  const handleRemove = useCallback((id: string) => {
    setEditableTransactions((prev) => prev.filter((tx) => tx.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleSelectToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedTransactions = useMemo(() => {
    return editableTransactions.filter((tx) => selectedIds.has(tx.id));
  }, [editableTransactions, selectedIds]);

  const handleSaveAll = async () => {
    if (!selectedAccountId) {
      showError('Please select an account to save transactions to.');
      return;
    }
    if (selectedTransactions.length === 0) {
      showError('Please select at least one transaction to save.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        transactions: selectedTransactions.map((tx) => {
          const date = new Date(tx.date);
          const createdAt = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();

          return {
            text: tx.description,
            amount: tx.debit !== undefined ? tx.debit : (tx.credit ?? 0),
            isIncome: tx.debit === undefined,
            categoryName: tx.category,
            transfer: tx.transfer,
            createdAt,
            accountId: selectedAccountId
          };
        })
      };

      const result = await transactionBulkCreate(payload);
      showSuccess(
        `Successfully added ${result?.created} transactions. ${result?.skipped} were skipped.`
      );
      await invalidate(['transactions', 'dashboardData', 'accounts', 'customAnalytics']);
      setIsModalOpen(false);
      setIsImported(true);
    } catch (error: any) {
      showError(error.message || 'Failed to save transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    const txsToSummarize = isModalOpen ? selectedTransactions : editableTransactions;
    return txsToSummarize.reduce(
      (acc, tx) => {
        if (tx.credit !== undefined) acc.income += tx.credit;
        if (tx.debit !== undefined) acc.expense += tx.debit;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [selectedTransactions, editableTransactions, isModalOpen]);

  const netImpact = summary.income - summary.expense;

  const editButtonContent = isImported ? (
    <>
      <Icon name='checkCircle' className='text-success mr-2 h-4 w-4' />
      Imported Successfully
    </>
  ) : (
    <>
      <Icon name='edit' className='mr-2 h-4 w-4' />
      View & Edit {editableTransactions.length} Transactions
    </>
  );

  return (
    <>
      <Card className='bg-muted/50 mt-2 w-full max-w-full overflow-hidden border'>
        <CardContent className='p-3'>
          <p className='mb-2 text-sm font-medium'>
            Found {editableTransactions.length} transaction(s)
          </p>
          <Card className='bg-background'>
            <CardContent className='grid grid-cols-3 gap-2 p-3 text-center'>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-xs'>Income</p>
                <p className='text-success font-semibold'>
                  {formatCurrency(summary.income, 'INR')}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-xs'>Expenses</p>
                <p className='text-destructive font-semibold'>
                  {formatCurrency(summary.expense, 'INR')}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-muted-foreground text-xs'>Net Impact</p>
                <p
                  className={cn(
                    'font-semibold',
                    netImpact > 0 && 'text-success',
                    netImpact < 0 && 'text-destructive'
                  )}
                >
                  {formatCurrency(netImpact, 'INR')}
                </p>
              </div>
            </CardContent>
          </Card>
          {editableTransactions.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='mt-3 block w-full' tabIndex={isImported ? 0 : -1}>
                    <Button
                      onClick={() => setIsModalOpen(true)}
                      variant={isImported ? 'link' : 'outline'}
                      className='w-full'
                      disabled={isImported}
                    >
                      {editButtonContent}
                    </Button>
                  </span>
                </TooltipTrigger>
                {isImported && (
                  <TooltipContent>
                    <p>These transactions have already been saved to your account.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='flex max-h-[90dvh] w-full max-w-2xl flex-col'>
          <DialogHeader>
            <DialogTitle>Review Extracted Transactions</DialogTitle>
            <DialogDescription>
              Select and edit details below before saving them to your account.
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 space-y-4 overflow-y-hidden py-4'>
            <div className='px-1'>
              <Label htmlFor='account-select-modal'>Save to Account *</Label>
              <Select onValueChange={setSelectedAccountId} disabled={isLoading}>
                <SelectTrigger id='account-select-modal' className='mt-2 w-full'>
                  <SelectValue
                    placeholder={isLoadingAccounts ? 'Loading...' : 'Select an account'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='bg-muted/50 flex items-center justify-between rounded-lg border p-2'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='select-all-checkbox'
                  checked={selectedIds.size === editableTransactions.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIds(new Set(editableTransactions.map((tx) => tx.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
                <Label htmlFor='select-all-checkbox' className='text-sm font-medium'>
                  Select All
                </Label>
              </div>
              <span className='text-muted-foreground text-sm'>
                {selectedIds.size} of {editableTransactions.length} selected
              </span>
            </div>

            <ScrollArea className='-mr-6 max-h-[40vh] pr-6'>
              <div className='space-y-2'>
                {editableTransactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onFieldChange={handleFieldChange}
                    onRemove={handleRemove}
                    currency={selectedAccountCurrency}
                    isSelected={selectedIds.has(tx.id)}
                    onSelectToggle={handleSelectToggle}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type='button' variant='outline'>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleSaveAll}
              disabled={isLoading || !selectedAccountId || selectedIds.size === 0 || isImported}
              className='min-w-[120px]'
            >
              {isLoading ? (
                <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Icon name='save' className='mr-2 h-4 w-4' />
              )}
              Save {selectedIds.size} Transaction(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiTransactionPreview;
