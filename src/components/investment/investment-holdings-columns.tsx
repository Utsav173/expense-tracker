'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { InvestmentAPI } from '@/lib/api/api-types';
import { format, formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { DataTableColumnHeader } from '../ui/column-header';
import { InvestmentHoldingActions } from './investment-holding-actions';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestmentHoldingsColumnsProps {
  handleEdit: (investment: InvestmentAPI.Investment) => void;
  handleDeleteClick: (id: string) => void;
  accountCurrency: string;
}

export const investmentHoldingsColumns = ({
  handleEdit,
  handleDeleteClick,
  accountCurrency
}: InvestmentHoldingsColumnsProps): ColumnDef<InvestmentAPI.Investment>[] => [
  {
    accessorKey: 'symbol',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Symbol' className='min-w-[120px]' />
    ),
    meta: { header: 'Symbol' },
    cell: ({ row }) => {
      const symbol = row.original.symbol;
      return (
        <div className='flex flex-col gap-1'>
          <span className='text-foreground text-sm font-semibold tracking-wide'>{symbol}</span>
          <span className='text-muted-foreground text-xs'>{row.original.shares} shares</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'purchasePrice',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Purchase Price'
        className='min-w-[130px] justify-end'
      />
    ),
    meta: { header: 'Purchase Price' },
    cell: ({ row }) => {
      const inv = row.original;
      const price = inv.purchasePrice || 0;
      return (
        <div className='text-right'>
          <div className='font-mono text-sm font-medium'>
            {formatCurrency(price, accountCurrency)}
          </div>
          <div className='text-muted-foreground text-xs'>per share</div>
        </div>
      );
    }
  },
  {
    accessorKey: 'purchaseDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Purchase Date' className='min-w-[140px]' />
    ),
    meta: { header: 'Purchase Date' },
    cell: ({ row }) => {
      const date = row.original.purchaseDate;
      if (!date) return <span className='text-muted-foreground'>N/A</span>;

      const purchaseDate = new Date(date);
      const isRecent = Date.now() - purchaseDate.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center gap-2'>
              <Calendar className='text-muted-foreground h-3 w-3' />
              <div className='flex flex-col'>
                <span className='text-sm'>{format(purchaseDate, 'MMM d, yyyy')}</span>
                {isRecent && (
                  <Badge variant='secondary' className='w-fit text-xs'>
                    Recent
                  </Badge>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formatDistanceToNow(purchaseDate, { addSuffix: true })}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
  },
  {
    accessorKey: 'investedAmount',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Invested Amount'
        className='min-w-[140px] justify-end'
      />
    ),
    meta: { header: 'Invested Amount' },
    cell: ({ row }) => {
      const inv = row.original;
      const amount = inv.investedAmount || 0;
      const shares = inv.shares || 0;
      const avgCost = shares > 0 ? amount / shares : 0;

      return (
        <div className='text-right'>
          <div className='text-foreground font-mono text-sm font-semibold'>
            {formatCurrency(amount, accountCurrency)}
          </div>
          <div className='text-muted-foreground text-xs'>
            Avg: {formatCurrency(avgCost, accountCurrency)}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'dividend',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Dividend'
        className='min-w-[120px] justify-end'
      />
    ),
    meta: { header: 'Dividend' },
    cell: ({ row }) => {
      const inv = row.original;
      const dividend = inv.dividend || 0;
      const investedAmount = inv.investedAmount || 0;
      const yieldPercentage = investedAmount > 0 ? (dividend / investedAmount) * 100 : 0;

      const isPositive = dividend > 0;
      const isHigh = yieldPercentage > 3; // Consider >3% as high yield

      return (
        <div className='text-right'>
          <div
            className={cn(
              'flex items-center justify-end gap-1 font-mono text-sm font-medium',
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            )}
          >
            {formatCurrency(dividend, accountCurrency)}
          </div>
          {isPositive && (
            <div className='flex items-center justify-end gap-1'>
              <Badge
                variant={isHigh ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  isHigh && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                )}
              >
                {yieldPercentage.toFixed(2)}% yield
              </Badge>
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'performance',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Performance'
        className='min-w-[120px] justify-center'
      />
    ),
    cell: ({ row }) => {
      const inv = row.original;
      const invested = inv.investedAmount || 0;
      const dividend = inv.dividend || 0;
      const totalReturn = dividend; // You might want to add current value calculation here
      const returnPercentage = invested > 0 ? (totalReturn / invested) * 100 : 0;

      const isPositive = returnPercentage > 0;
      const isSignificant = Math.abs(returnPercentage) > 1;

      return (
        <div className='flex flex-col items-center gap-1'>
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : returnPercentage < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
            )}
          >
            {isSignificant &&
              (isPositive ? (
                <TrendingUp className='h-3 w-3' />
              ) : (
                <TrendingDown className='h-3 w-3' />
              ))}
            {returnPercentage > 0 ? '+' : ''}
            {returnPercentage.toFixed(2)}%
          </div>
          <div className='text-muted-foreground text-xs'>
            {formatCurrency(totalReturn, accountCurrency)}
          </div>
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Actions'
        className='min-w-[100px] justify-center'
      />
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        <InvestmentHoldingActions
          investment={row.original}
          handleEdit={handleEdit}
          handleDeleteClick={handleDeleteClick}
          accountCurrency={accountCurrency}
          key={row.original.id}
        />
      </div>
    )
  }
];
