import React, { useState, useEffect } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import { Transaction } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Tag, CalendarDays } from 'lucide-react';

interface TransactionListSummaryProps {
  transactions: Transaction[];
}

const MAX_INITIAL_DISPLAY = 5;

export const TransactionListSummary: React.FC<TransactionListSummaryProps> = ({ transactions }) => {
  const [showAll, setShowAll] = useState(transactions.length <= MAX_INITIAL_DISPLAY);

  useEffect(() => {
    setShowAll(transactions.length <= MAX_INITIAL_DISPLAY);
  }, [transactions.length]);

  const displayedTransactions = showAll ? transactions : transactions.slice(0, MAX_INITIAL_DISPLAY);

  return (
    <div className='border-border/50 mt-2 space-y-1 border-t pt-2'>
      <p className='mb-1.5 text-[11px] font-semibold opacity-80'>
        Found {transactions.length} Transaction{transactions.length > 1 ? 's' : ''}:
      </p>
      <ScrollArea className='max-h-[180px] pr-2'>
        <div className='space-y-2'>
          {displayedTransactions.map((tx) => {
            const dateFormatted = tx.createdAt
              ? format(parseISO(tx.createdAt), 'MMM d, yy')
              : 'N/A';
            const amountColor = tx.isIncome ? 'text-success' : 'text-destructive';
            const AmountIcon = tx.isIncome ? ArrowUpCircle : ArrowDownCircle;

            return (
              <TooltipProvider key={tx.id} delayDuration={150}>
                <div className='bg-muted/50 border-border/30 flex flex-col gap-1 rounded border p-2 text-xs shadow-sm'>
                  {/* Line 1: Description & Amount */}
                  <div className='flex items-start justify-between gap-2'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className='flex-1 cursor-default truncate font-medium break-words'
                          title={tx.text}
                        >
                          {tx.text}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent align='start'>
                        <p>{tx.text}</p>
                      </TooltipContent>
                    </Tooltip>

                    <span className={cn('font-semibold whitespace-nowrap', amountColor)}>
                      <AmountIcon className='mr-0.5 inline-block h-3 w-3' />
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                  {/* Line 2: Category & Date */}
                  <div className='text-muted-foreground flex items-center justify-between gap-2 text-[10px]'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='flex cursor-default items-center gap-1 truncate'>
                          <Tag className='h-2.5 w-2.5 shrink-0' />
                          <span className='truncate'>{tx.category?.name ?? 'Uncategorized'}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent align='start'>
                        <p>{tx.category?.name ?? 'Uncategorized'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className='flex items-center gap-1 whitespace-nowrap'>
                      <CalendarDays className='h-2.5 w-2.5' />
                      {dateFormatted}
                    </span>
                  </div>
                </div>
              </TooltipProvider>
            );
          })}
          {!showAll && transactions.length > MAX_INITIAL_DISPLAY && (
            <Button
              variant='link'
              size='sm'
              className='h-auto p-0 text-xs'
              onClick={() => setShowAll(true)}
            >
              Show {transactions.length - MAX_INITIAL_DISPLAY} more...
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
