import React from 'react';
import { InvestmentAccount } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Edit, Trash, TrendingUp, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';

const cardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } },
  hover: { y: -6, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } }
};

interface InvestmentAccountCardProps {
  account: InvestmentAccount & { lastUpdated?: string };
  onEdit: (account: InvestmentAccount) => void;
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
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const lastUpdated = formatDate(account.updatedAt);

  return (
    <motion.div
      variants={cardVariants}
      initial='initial'
      animate='animate'
      whileHover='hover'
      className={cn(
        'group bg-card relative flex h-full flex-col overflow-hidden rounded-xl border shadow-sm',
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
            <Badge className='border-transparent bg-amber-100 text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900'>
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
            <Edit size={13} />
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
            <Trash size={13} />
          </Button>
        </div>
      </div>

      <div className='flex flex-grow flex-col justify-center px-4 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110'>
            <TrendingUp className='h-5 w-5' />
          </div>
          <div className='flex-1'>
            <p className='text-muted-foreground text-xs font-medium'>Current Balance</p>
            <p className='text-foreground text-2xl font-bold tracking-tight'>
              {formatCurrency(account.balance || 0, account.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-background/30 mt-auto border-t p-4'>
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
            <ChevronRight
              size={14}
              className='transition-transform duration-200 group-hover/link:translate-x-0.5'
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default InvestmentAccountCard;
