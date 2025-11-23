'use client';

import { Icon } from '../ui/icon';

export const MockDashboard = () => {
  return (
    <div className='border-border/50 bg-background/50 text-foreground relative flex h-full w-full overflow-hidden rounded-2xl border shadow-lg backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Sidebar - Mini */}
      <div className='border-border/50 flex w-14 flex-col items-center border-r py-4'>
        <div className='bg-primary/20 mb-6 h-8 w-8 rounded-full p-1.5'>
          <div className='bg-primary h-full w-full rounded-full' />
        </div>
        <div className='flex flex-col gap-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='bg-muted/50 hover:bg-muted h-8 w-8 rounded-lg p-2 transition'>
              <div className='bg-foreground/20 h-full w-full rounded-sm' />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 p-4'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <div className='bg-foreground/20 h-2 w-20 rounded-full' />
            <div className='bg-foreground/10 mt-1 h-4 w-32 rounded-full' />
          </div>
          <div className='bg-foreground/10 h-8 w-8 rounded-full' />
        </div>

        {/* Dashboard Grid */}
        <div className='grid gap-4'>
          {/* Total Balance Card */}
          <div className='border-border/50 bg-card/50 rounded-xl border p-4'>
            <div className='text-muted-foreground mb-2 text-xs'>Total Balance</div>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold'>$24,500.00</span>
              <span className='rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400'>
                +12%
              </span>
            </div>
          </div>

          {/* Spending Chart Mock */}
          <div className='border-border/50 bg-card/50 rounded-xl border p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='text-muted-foreground text-xs'>Spending Activity</div>
              <div className='bg-foreground/5 h-4 w-16 rounded-full' />
            </div>
            <div className='flex h-24 items-end justify-between gap-1'>
              {[35, 55, 40, 70, 50, 85, 60].map((h, i) => (
                <div
                  key={i}
                  className='group bg-primary/20 hover:bg-primary/40 relative w-full rounded-t-sm transition-all'
                >
                  <div
                    className='bg-primary group-hover:bg-primary/80 absolute bottom-0 w-full rounded-t-sm transition-all duration-500'
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className='space-y-2'>
            <div className='text-muted-foreground text-xs font-medium'>Recent Transactions</div>
            {[
              { name: 'Netflix', amount: '-$15.99', icon: 'tv' },
              { name: 'Grocery', amount: '-$84.20', icon: 'shoppingCart' }
            ].map((tx, i) => (
              <div key={i} className='bg-muted/30 flex items-center justify-between rounded-lg p-2'>
                <div className='flex items-center gap-3'>
                  <div className='bg-background flex h-8 w-8 items-center justify-center rounded-full'>
                    <Icon name={tx.icon as any} className='text-muted-foreground h-4 w-4' />
                  </div>
                  <div className='text-sm font-medium'>{tx.name}</div>
                </div>
                <div className='text-muted-foreground text-sm font-medium'>{tx.amount}</div>
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
    <div className='border-border/50 bg-background/50 text-foreground relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border shadow-lg backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Chat Header */}
      <div className='border-border/50 bg-muted/30 flex items-center gap-3 border-b p-3'>
        <div className='relative'>
          <div className='bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-full'>
            <Icon name='bot' className='h-5 w-5' />
          </div>
          <div className='border-background absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 bg-emerald-500' />
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
          <div className='bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-md'>
            Show me my dining expenses for this month.
          </div>
        </div>

        {/* AI Response with Widget */}
        <div className='flex justify-start'>
          <div className='border-border/50 bg-card max-w-[90%] space-y-3 rounded-2xl rounded-tl-sm border p-4 shadow-sm backdrop-blur-md'>
            <p className='text-sm leading-relaxed'>
              You've spent <span className='text-foreground font-bold'>$450.00</span> on dining in
              October. That's 15% less than last month! 🎉
            </p>
            {/* Mini Widget */}
            <div className='bg-muted/50 rounded-xl p-3'>
              <div className='text-muted-foreground mb-2 flex justify-between text-xs'>
                <span>Dining Budget</span>
                <span>$450 / $600</span>
              </div>
              <div className='bg-background h-2 w-full overflow-hidden rounded-full'>
                <div className='h-full w-[75%] rounded-full bg-emerald-500' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className='border-border/50 bg-muted/30 border-t p-3'>
        <div className='border-border/50 bg-background flex items-center gap-2 rounded-full border p-1.5 pl-4'>
          <div className='text-muted-foreground text-xs'>Ask anything...</div>
          <div className='bg-primary text-primary-foreground ml-auto flex h-7 w-7 items-center justify-center rounded-full shadow-lg'>
            <Icon name='arrowUp' className='h-3.5 w-3.5' />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MockImport = () => {
  return (
    <div className='border-border/50 bg-background/50 text-foreground relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 shadow-lg backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Upload Zone */}
      <div className='border-border/50 bg-muted/30 hover:border-primary/50 hover:bg-primary/5 mb-6 flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed transition'>
        <div className='text-muted-foreground flex flex-col items-center gap-2'>
          <Icon name='uploadCloud' className='h-8 w-8' />
          <span className='text-xs'>Drop statements here</span>
        </div>
      </div>

      {/* File List */}
      <div className='w-full space-y-3'>
        {/* File 1: Processing */}
        <div className='border-border/50 bg-card flex items-center gap-3 rounded-lg border p-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded bg-blue-500/20 text-blue-500'>
            <Icon name='fileText' className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-1'>
            <div className='flex justify-between text-xs font-medium'>
              <span>statement_oct.pdf</span>
              <span className='text-blue-500'>Processing...</span>
            </div>
            <div className='bg-muted h-1 w-full overflow-hidden rounded-full'>
              <div className='h-full w-[60%] animate-pulse rounded-full bg-blue-500' />
            </div>
          </div>
        </div>

        {/* File 2: Done */}
        <div className='border-border/50 bg-card flex items-center gap-3 rounded-lg border p-3 opacity-60'>
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

export const MockAuth = () => {
  return (
    <div className='border-border/50 bg-background/50 text-foreground relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 shadow-lg backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Lock Icon */}
      <div className='bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
        <Icon name='lock' className='text-primary h-8 w-8' />
      </div>

      {/* Login Form Mock */}
      <div className='w-full max-w-[200px] space-y-3'>
        <div className='border-border/50 bg-card rounded-lg border p-2'>
          <div className='bg-muted h-2 w-16 rounded-full' />
        </div>
        <div className='border-border/50 bg-card rounded-lg border p-2'>
          <div className='bg-muted h-2 w-20 rounded-full' />
        </div>
        <div className='bg-primary rounded-full p-2.5 text-center'>
          <div className='bg-primary-foreground/80 mx-auto h-2 w-12 rounded-full' />
        </div>
      </div>

      {/* Security Badge */}
      <div className='mt-4 flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1'>
        <Icon name='shield' className='h-3 w-3 text-emerald-500' />
        <span className='text-[10px] font-medium text-emerald-600 dark:text-emerald-400'>
          JWT Secured
        </span>
      </div>
    </div>
  );
};

export const MockSharing = () => {
  return (
    <div className='border-border/50 bg-background/50 text-foreground relative flex h-full w-full flex-col justify-center overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Header */}
      <div className='mb-4 flex items-center gap-2'>
        <Icon name='users' className='text-primary h-5 w-5' />
        <div className='bg-foreground/20 h-2 w-20 rounded-full' />
      </div>

      {/* Shared Users */}
      <div className='space-y-2'>
        {[
          { initials: 'JD', status: 'Owner' },
          { initials: 'SK', status: 'Editor' }
        ].map((user, i) => (
          <div
            key={i}
            className='border-border/50 bg-card flex items-center justify-between rounded-lg border p-2'
          >
            <div className='flex items-center gap-2'>
              <div className='bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold'>
                {user.initials}
              </div>
              <div className='bg-muted h-2 w-16 rounded-full' />
            </div>
            <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[9px] font-medium'>
              {user.status}
            </span>
          </div>
        ))}
      </div>

      {/* Add User Button */}
      <div className='border-border/50 bg-muted/30 mt-3 flex items-center justify-center gap-1 rounded-lg border border-dashed p-2'>
        <Icon name='userPlus' className='text-muted-foreground h-3 w-3' />
        <span className='text-muted-foreground text-[10px]'>Invite User</span>
      </div>
    </div>
  );
};

export const MockCRUD = () => {
  return (
    <div className='border-border/50 bg-background/50 text-foreground relative flex h-full w-full flex-col justify-center overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-xl dark:bg-neutral-900/90'>
      {/* Action Buttons */}
      <div className='mb-3 grid grid-cols-2 gap-2'>
        <div className='border-border/50 flex items-center justify-center gap-1.5 rounded-lg border bg-emerald-500/10 p-2'>
          <Icon name='plus' className='h-3 w-3 text-emerald-500' />
          <span className='text-[10px] font-medium text-emerald-600 dark:text-emerald-400'>
            Create
          </span>
        </div>
        <div className='border-border/50 flex items-center justify-center gap-1.5 rounded-lg border bg-blue-500/10 p-2'>
          <Icon name='pencil' className='h-3 w-3 text-blue-500' />
          <span className='text-[10px] font-medium text-blue-600 dark:text-blue-400'>Edit</span>
        </div>
      </div>

      {/* Transaction List */}
      <div className='space-y-2'>
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className='border-border/50 bg-card flex items-center justify-between rounded-lg border p-2'
          >
            <div className='flex items-center gap-2'>
              <div className='bg-muted h-6 w-6 rounded' />
              <div className='bg-muted h-2 w-16 rounded-full' />
            </div>
            <div className='flex gap-1'>
              <div className='h-5 w-5 rounded bg-blue-500/20 p-1'>
                <Icon name='pencil' className='h-full w-full text-blue-500' />
              </div>
              <div className='h-5 w-5 rounded bg-red-500/20 p-1'>
                <Icon name='trash2' className='h-full w-full text-red-500' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
