'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { GoalAPI, UserAPI } from '@/lib/api/api-types';
import { format, isAfter, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '../ui/column-header';
import { GoalActions } from './goal-actions';
import { cn } from '@/lib/utils';
import { SingleLineEllipsis } from '../ui/ellipsis-components';
import { Icon } from '../ui/icon';
import { IconName } from '../ui/icon-map';

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
    cell: ({ row }) => {
      const goal = row.original;
      const saved = goal.savedAmount || 0;
      const target = goal.targetAmount;
      const progress = target > 0 ? (saved / target) * 100 : 0;
      const isCompleted = progress >= 100;

      return (
        <div className='flex max-w-[320px] items-center gap-2'>
          {isCompleted ? (
            <Icon name='checkCircle2' className='text-success h-4 w-4 shrink-0' />
          ) : (
            <Icon name='target' className='text-muted-foreground h-4 w-4 shrink-0' />
          )}
          <div className='flex min-w-0 flex-col'>
            <SingleLineEllipsis className={cn('font-medium', isCompleted && 'text-success')}>
              {goal.name}
            </SingleLineEllipsis>
            {isCompleted && <span className='text-success text-xs'>Completed</span>}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'targetAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Target Amount' />,
    meta: { header: 'Target Amount' },
    cell: ({ row }) => {
      const amount = row.original.targetAmount;
      return (
        <div className='flex flex-col items-start'>
          <span className='text-primary text-sm font-semibold'>
            {formatCurrency(amount, user?.preferredCurrency || 'INR')}
          </span>
          <span className='text-muted-foreground text-xs'>Target</span>
        </div>
      );
    }
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
      const isCompleted = progress >= 100;

      return (
        <div className='flex min-w-[180px] flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <span className='text-success text-sm font-semibold'>
              {formatCurrency(saved, user?.preferredCurrency || 'INR')}
            </span>
            <Badge
              variant={isCompleted ? 'default' : 'secondary'}
              className={cn(
                'px-2 py-0.5 text-xs',
                isCompleted && 'bg-success text-success-foreground'
              )}
            >
              {progress.toFixed(1)}%
            </Badge>
          </div>
          <div className='relative'>
            <Progress
              value={progress}
              className='h-2.5'
              style={
                {
                  '--progress-foreground': isCompleted
                    ? 'var(--hue-success)'
                    : progress >= 75
                      ? 'var(--hue-primary)'
                      : progress >= 50
                        ? 'var(--hue-warning)'
                        : progress >= 25
                          ? 'var(--hue-destructive)'
                          : 'var(--hue-destructive)'
                } as React.CSSProperties
              }
            />
          </div>
          {!isCompleted && (
            <span className='text-muted-foreground text-xs'>
              {formatCurrency(remaining, user?.preferredCurrency || 'INR')} remaining
            </span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'targetDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Target Date' />,
    meta: { header: 'Target Date' },
    cell: ({ row }) => {
      const goal = row.original;
      const date = goal.targetDate;
      const saved = goal.savedAmount || 0;
      const target = goal.targetAmount;
      const isCompleted = (saved / target) * 100 >= 100;

      if (!date) {
        return <span className='text-muted-foreground text-sm'>No deadline</span>;
      }

      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) {
        return <span className='text-muted-foreground text-sm'>Invalid date</span>;
      }

      const today = new Date();
      const daysLeft = differenceInDays(dateObj, today);
      const isOverdue = isAfter(today, dateObj) && !isCompleted;
      const isUrgent = daysLeft <= 30 && daysLeft > 0 && !isCompleted;

      const getDateStatus = (): {
        color: string;
        icon: IconName;
        label: string;
      } => {
        if (isCompleted) return { color: 'text-success', icon: 'checkCircle2', label: 'Completed' };
        if (isOverdue)
          return { color: 'text-destructive', icon: 'alertTriangle', label: 'Overdue' };
        if (isUrgent) return { color: 'text-warning', icon: 'clock', label: 'Urgent' };
        return { color: 'text-foreground', icon: 'clock', label: 'On track' };
      };

      const status = getDateStatus();

      return (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1.5'>
            <Icon name={status.icon} className={cn('h-3.5 w-3.5', status.color)} />
            <span className={cn('text-sm font-medium', status.color)}>
              {format(dateObj, 'MMM d, yyyy')}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            {isCompleted ? (
              <Badge variant='default' className='bg-success text-success-foreground text-xs'>
                Completed
              </Badge>
            ) : isOverdue ? (
              <Badge variant='destructive-muted' className='text-xs'>
                {Math.abs(daysLeft)} days overdue
              </Badge>
            ) : isUrgent ? (
              <Badge
                variant='secondary'
                className='bg-warning-muted text-warning-foreground text-xs'
              >
                {daysLeft} days left
              </Badge>
            ) : daysLeft > 0 ? (
              <span className='text-muted-foreground text-xs'>{daysLeft} days left</span>
            ) : null}
          </div>
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => <GoalActions goal={row.original} user={user} refetchGoals={refetchGoals} />
  }
];
