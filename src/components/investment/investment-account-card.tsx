import React from 'react';
import type { InvestmentAccountAPI } from '@/lib/api/api-types';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';
import { Icon } from '../ui/icon';

const cardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } }
};

interface InvestmentAccountCardProps {
  account: InvestmentAccountAPI.InvestmentAccount;
  onEdit: (account: InvestmentAccountAPI.InvestmentAccount) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const InvestmentAccountCard: React.FC<InvestmentAccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  className
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return null;
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const lastUpdated = formatDate(account.updatedAt ?? undefined);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn(
        'group bg-card group-hover:border-primary/30 relative flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 group-hover:shadow-lg',
        className
      )}
    >
      <div className='pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
        <div className='via-primary/10 absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-transparent' />
      </div>

      <div className='flex items-start justify-between p-4'>
        <div className='flex-1'>
          <h3 className='text-foreground mb-1 line-clamp-1 font-semibold'>{account.name}</h3>
          {account.platform && (
            <Badge variant='outline' className='text-amber-700 dark:text-amber-300'>
              {account.platform}
            </Badge>
          )}
        </div>
        <div className='flex scale-90 items-center gap-1 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 max-sm:opacity-100'>
          <Button
            size='icon'
            variant='ghost'
            className='h-7 w-7 rounded-md'
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEdit(account);
            }}
          >
            <Icon name='edit' className='text-muted-foreground h-3.5 w-3.5' />
          </Button>
          <Button
            size='icon'
            variant='ghost'
            className='hover:bg-destructive/10 hover:text-destructive h-7 w-7 rounded-md'
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(account.id);
            }}
          >
            <Icon name='trash' className='text-destructive h-3.5 w-3.5' />
          </Button>
        </div>
      </div>

      <div className='flex flex-grow flex-col justify-center px-4 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110'>
            <Icon name='trendingUp' className='h-5 w-5' />
          </div>
          <div className='flex-1'>
            <p className='text-muted-foreground text-xs font-medium'>Current Balance</p>
            <p className='text-foreground font-mono text-2xl font-bold tracking-tight'>
              {formatCurrency(account.balance || 0, account.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-muted/30 mt-auto border-t p-4'>
        <div className='flex items-center justify-between'>
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <motion.div
              className='h-2 w-2 rounded-full bg-green-500'
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span>Active</span>
            {lastUpdated && (
              <>
                <span className='text-muted-foreground/50'>•</span>
                <span>Updated {lastUpdated}</span>
              </>
            )}
          </div>
          <Link
            href={`/investment/${account.id}`}
            className='group/link text-primary flex items-center gap-1 text-sm font-medium'
          >
            <span className='underline-offset-4 group-hover/link:underline'>View Details</span>
            <Icon
              name='chevronRight'
              className='h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5'
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default InvestmentAccountCard;
