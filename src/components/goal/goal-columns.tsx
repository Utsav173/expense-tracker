'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { GoalAPI, UserAPI } from '@/lib/api/api-types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { DataTableColumnHeader } from '../ui/column-header';
import { GoalActions } from './goal-actions';

interface GoalColumnsProps {
  user: UserAPI.UserProfile | undefined;
  refetchGoals: () => void;
}

export const createGoalColumns = ({
  user,
  refetchGoals
}: GoalColumnsProps): ColumnDef<GoalAPI.SavingGoal>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Goal Name' />,
    meta: { header: 'Goal Name' },
    cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>
  },
  {
    accessorKey: 'targetAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Target Amount' />,
    meta: { header: 'Target Amount' },
    cell: ({ row }) => (
      <span className='text-primary font-semibold'>
        {formatCurrency(row.original.targetAmount, user?.preferredCurrency || 'INR')}
      </span>
    )
  },
  {
    accessorKey: 'savedAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Progress' />,
    meta: { header: 'Progress' },
    cell: ({ row }) => {
      const goal = row.original;
      const saved = goal.savedAmount || 0;
      const target = goal.targetAmount;
      const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
      const remaining = Math.max(0, target - saved);

      return (
        <div className='flex min-w-[150px] flex-col gap-1'>
          <span className='text-success font-semibold'>
            {formatCurrency(saved, user?.preferredCurrency || 'INR')}
          </span>
          <Progress value={progress} className='h-2' />
          <span className='text-muted-foreground text-xs'>
            {formatCurrency(remaining, user?.preferredCurrency || 'INR')} remaining
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'targetDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Target Date' />,
    meta: { header: 'Target Date' },
    cell: ({ row }) => {
      const date = row.original.targetDate;
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj && !isNaN(dateObj.getTime()) ? format(dateObj, 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <GoalActions goal={row.original} user={user} refetchGoals={refetchGoals} />
  }
];
