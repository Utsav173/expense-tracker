'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '../ui/icon';

export const MockDashboard = () => {
  return (
    <div className='relative flex h-full w-full overflow-hidden rounded-2xl border border-border/50 bg-background/50 text-foreground shadow-2xl backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Sidebar - Mini */}
      <div className='flex w-14 flex-col items-center border-r border-border/50 py-4'>
        <div className='mb-6 h-8 w-8 rounded-full bg-primary/20 p-1.5'>
          <div className='h-full w-full rounded-full bg-primary' />
        </div>
        <div className='flex flex-col gap-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='h-8 w-8 rounded-lg bg-muted/50 p-2 transition hover:bg-muted'>
              <div className='h-full w-full rounded-sm bg-foreground/20' />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 p-4'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <div className='h-2 w-20 rounded-full bg-foreground/20' />
            <div className='mt-1 h-4 w-32 rounded-full bg-foreground/10' />
          </div>
          <div className='h-8 w-8 rounded-full bg-foreground/10' />
        </div>

        {/* Dashboard Grid */}
        <div className='grid gap-4'>
          {/* Total Balance Card */}
          <div className='rounded-xl border border-border/50 bg-card/50 p-4'>
            <div className='mb-2 text-xs text-muted-foreground'>Total Balance</div>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold'>$24,500.00</span>
              <span className='rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400'>
                +12%
              </span>
            </div>
          </div>

          {/* Spending Chart Mock */}
          <div className='rounded-xl border border-border/50 bg-card/50 p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='text-xs text-muted-foreground'>Spending Activity</div>
              <div className='h-4 w-16 rounded-full bg-foreground/5' />
            </div>
            <div className='flex h-24 items-end justify-between gap-1'>
              {[35, 55, 40, 70, 50, 85, 60].map((h, i) => (
                <div key={i} className='group relative w-full rounded-t-sm bg-primary/20 transition-all hover:bg-primary/40'>
                  <div
                    className='absolute bottom-0 w-full rounded-t-sm bg-primary transition-all duration-500 group-hover:bg-primary/80'
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className='space-y-2'>
            <div className='text-xs font-medium text-muted-foreground'>Recent Transactions</div>
            {[
              { name: 'Netflix', amount: '-$15.99', icon: 'tv' },
              { name: 'Grocery', amount: '-$84.20', icon: 'shoppingCart' },
            ].map((tx, i) => (
              <div key={i} className='flex items-center justify-between rounded-lg bg-muted/30 p-2'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-background'>
                    <Icon name={tx.icon as any} className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <div className='text-sm font-medium'>{tx.name}</div>
                </div>
                <div className='text-sm font-medium text-muted-foreground'>{tx.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MockChat = () => {
  return (
    <div className='relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-background/50 text-foreground shadow-2xl backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Chat Header */}
      <div className='flex items-center gap-3 border-b border-border/50 bg-muted/30 p-3'>
        <div className='relative'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary'>
            <Icon name='bot' className='h-5 w-5' />
          </div>
          <div className='absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500' />
        </div>
        <div>
          <div className='text-sm font-bold'>Expense AI</div>
          <div className='text-[10px] text-emerald-500'>Online</div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className='flex-1 space-y-4 p-4'>
        {/* User Message */}
        <div className='flex justify-end'>
          <div className='max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-md'>
            Show me my dining expenses for this month.
          </div>
        </div>

        {/* AI Response with Widget */}
        <div className='flex justify-start'>
          <div className='max-w-[90%] space-y-3 rounded-2xl rounded-tl-sm border border-border/50 bg-card p-4 shadow-sm backdrop-blur-md'>
            <p className='text-sm leading-relaxed'>
              You've spent <span className='font-bold text-foreground'>$450.00</span> on dining in October. That's 15% less than last month! 🎉
            </p>
            {/* Mini Widget */}
            <div className='rounded-xl bg-muted/50 p-3'>
              <div className='mb-2 flex justify-between text-xs text-muted-foreground'>
                <span>Dining Budget</span>
                <span>$450 / $600</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-background'>
                <div className='h-full w-[75%] rounded-full bg-emerald-500' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className='border-t border-border/50 bg-muted/30 p-3'>
        <div className='flex items-center gap-2 rounded-full border border-border/50 bg-background p-1.5 pl-4'>
          <div className='text-xs text-muted-foreground'>Ask anything...</div>
          <div className='ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg'>
            <Icon name='arrowUp' className='h-3.5 w-3.5' />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MockImport = () => {
  return (
    <div className='relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-6 text-foreground shadow-2xl backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Upload Zone */}
      <div className='mb-6 flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/30 transition hover:border-primary/50 hover:bg-primary/5'>
        <div className='flex flex-col items-center gap-2 text-muted-foreground'>
          <Icon name='uploadCloud' className='h-8 w-8' />
          <span className='text-xs'>Drop statements here</span>
        </div>
      </div>

      {/* File List */}
      <div className='w-full space-y-3'>
        {/* File 1: Processing */}
        <div className='flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded bg-blue-500/20 text-blue-500'>
            <Icon name='fileText' className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-1'>
            <div className='flex justify-between text-xs font-medium'>
              <span>statement_oct.pdf</span>
              <span className='text-blue-500'>Processing...</span>
            </div>
            <div className='h-1 w-full overflow-hidden rounded-full bg-muted'>
              <div className='h-full w-[60%] animate-pulse rounded-full bg-blue-500' />
            </div>
          </div>
        </div>

        {/* File 2: Done */}
        <div className='flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 opacity-60'>
          <div className='flex h-8 w-8 items-center justify-center rounded bg-emerald-500/20 text-emerald-500'>
            <Icon name='check' className='h-4 w-4' />
          </div>
          <div className='flex-1'>
            <div className='flex justify-between text-xs font-medium'>
              <span>statement_sep.pdf</span>
              <span className='text-emerald-500'>Done</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
