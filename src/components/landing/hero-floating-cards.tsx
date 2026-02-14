'use client';

import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export const HeroFloatingCards = () => {
  return (
    <div className='pointer-events-none absolute inset-0 z-0 overflow-hidden'>
      {/* Card 1: Income Notification - Top Right */}
      <motion.div
        initial={{ opacity: 0, y: 50, x: 50 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        className='absolute top-[15%] right-[5%] md:right-[10%] lg:right-[15%]'
      >
        <FloatingCard
          icon='wallet'
          title='Salary Received'
          amount='+$4,250.00'
          subtext='Just now'
          color='text-income'
          delay={0}
        />
      </motion.div>

      {/* Card 2: Subscription Alert - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, y: 50, x: -50 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
        className='absolute bottom-[20%] left-[5%] md:left-[10%]'
      >
        <FloatingCard
          icon='creditCard'
          title='Netflix Subscription'
          amount='-$15.99'
          subtext='Upcoming tomorrow'
          color='text-expense'
          delay={1.5}
        />
      </motion.div>

      {/* Card 3: Savings Goal - Bottom Right (Hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.1, ease: 'easeOut' }}
        className='absolute right-[20%] bottom-[10%] hidden lg:block'
      >
        <div
          className={cn(
            'flex w-64 items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md dark:bg-black/20',
            'animate-float'
          )}
          style={{ animationDelay: '2s' }}
        >
          <div className='bg-brand/20 text-brand flex h-10 w-10 items-center justify-center rounded-full'>
            <Icon name='target' className='h-5 w-5' />
          </div>
          <div className='flex-1 space-y-2'>
            <div className='flex justify-between text-xs font-medium'>
              <span>b new MacBook</span>
              <span className='text-muted-foreground'>75%</span>
            </div>
            <div className='bg-secondary h-2 w-full overflow-hidden rounded-full'>
              <div className='bg-brand h-full w-3/4 rounded-full' />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FloatingCard = ({
  icon,
  title,
  amount,
  subtext,
  color,
  delay
}: {
  icon: string;
  title: string;
  amount: string;
  subtext: string;
  color: string;
  delay: number;
}) => (
  <div
    className={cn(
      'flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 pr-8 shadow-2xl backdrop-blur-md dark:bg-black/20',
      'animate-float transition-transform duration-300 hover:scale-105'
    )}
    style={{ animationDelay: `${delay}s` }}
  >
    <div
      className={cn('flex h-12 w-12 items-center justify-center rounded-full bg-white/10', color)}
    >
      <Icon name={icon as any} className='h-6 w-6' />
    </div>
    <div>
      <p className='text-muted-foreground text-sm font-medium'>{title}</p>
      <p className={cn('text-lg font-bold', color)}>{amount}</p>
      <p className='text-muted-foreground/60 text-[10px]'>{subtext}</p>
    </div>
  </div>
);
