'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { InvestmentAPI } from '@/lib/api/api-types';
import { format, formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { DataTableColumnHeader } from '../ui/column-header';
import { InvestmentHoldingActions } from './investment-holding-actions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Icon } from '../ui/icon';

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
    header: ({ column }) => <DataTableColumnHeader column={column} title='Symbol' />,
    meta: { header: 'Symbol' },
    cell: ({ row }) => (
      <div>
        <span className='text-foreground text-sm font-semibold'>{row.original.symbol}</span>
        <div className='text-muted-foreground/75 text-xs'>{row.original.shares} shares</div>
      </div>
    )
  },
  {
    accessorKey: 'purchasePrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Purchase Price' className='justify-end' />
    ),
    meta: { header: 'Purchase Price' },
    cell: ({ row }) => (
      <div className='text-right'>
        <div className='text-sm font-semibold'>
          {formatCurrency(row.original.purchasePrice || 0, accountCurrency)}
        </div>
        <div className='text-muted-foreground text-xs'>per share</div>
      </div>
    )
  },
  {
    accessorKey: 'purchaseDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Purchase Date' />,
    meta: { header: 'Purchase Date' },
    cell: ({ row }) => {
      const date = row.original.purchaseDate;
      if (!date) return <span className='text-muted-foreground'>N/A</span>;
      const purchaseDate = new Date(date);
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center gap-2'>
              <Icon name='calendar' className='text-muted-foreground h-3 w-3' />
              <span className='text-sm'>{format(purchaseDate, 'MMM d, yyyy')}</span>
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
      <DataTableColumnHeader column={column} title='Invested Amount' className='justify-end' />
    ),
    meta: { header: 'Invested Amount' },
    cell: ({ row }) => {
      const inv = row.original;
      const amount = inv.investedAmount || 0;
      const shares = inv.shares || 0;
      const avgCost = shares > 0 ? amount / shares : 0;
      return (
        <div className='text-right'>
          <div className='text-foreground text-sm font-semibold'>
            {formatCurrency(amount, accountCurrency)}
          </div>
          <div className='text-muted-foreground/75 text-xs'>
            Avg: {formatCurrency(avgCost, accountCurrency)}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'dividend',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Dividend' className='justify-end' />
    ),
    meta: { header: 'Dividend' },
    cell: ({ row }) => {
      const inv = row.original;
      const dividend = inv.dividend || 0;
      const investedAmount = inv.investedAmount || 0;
      const yieldPercentage = investedAmount > 0 ? (dividend / investedAmount) * 100 : 0;
      const isPositive = dividend > 0;
      return (
        <div className='text-right'>
          <div
            className={cn(
              'text-sm font-semibold',
              isPositive ? 'text-positive' : 'text-muted-foreground'
            )}
          >
            {formatCurrency(dividend, accountCurrency)}
          </div>
          {isPositive && (
            <div className='text-muted-foreground/75 text-xs'>
              {yieldPercentage.toFixed(2)}% yield
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'performance',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Performance' className='justify-center' />
    ),
    cell: ({ row }) => {
      const inv = row.original;
      const invested = inv.investedAmount || 0;
      const totalReturn = inv.dividend || 0; // Simplified calculation
      const returnPercentage = invested > 0 ? (totalReturn / invested) * 100 : 0;
      const isPositive = returnPercentage > 0;
      const isNegative = returnPercentage < 0;

      const performanceColor = cn({
        'text-positive': isPositive,
        'text-negative': isNegative,
        'text-muted-foreground': !isPositive && !isNegative
      });

      const performanceColorSubtext = cn({
        'text-positive/75': isPositive,
        'text-negative/75': isNegative,
        'text-muted-foreground/75': !isPositive && !isNegative
      });

      return (
        <div className='flex flex-col items-center gap-1'>
          <div className={cn('flex items-center gap-1 text-sm font-semibold', performanceColor)}>
            {isPositive && <Icon name='trendingUp' className='h-3 w-3 brightness-70' />}
            {isNegative && <Icon name='trendingDown' className='h-3 w-3' />}
            {returnPercentage > 0 ? '+' : ''}
            {returnPercentage.toFixed(2)}%
          </div>
          <div className={cn('text-xs', performanceColorSubtext)}>
            {formatCurrency(totalReturn, accountCurrency)}
          </div>
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: () => <div className='text-center'>Actions</div>,
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
