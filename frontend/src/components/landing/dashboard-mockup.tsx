'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  IndianRupee,
  TrendingUp,
  PieChart as PieChartIcon,
  Users,
  CreditCard,
  PiggyBank,
  ShieldCheck,
  WalletCards,
  ReceiptText,
  Banknote,
  Scale,
  LayoutGrid,
  Settings,
  MoreVertical
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const MockupStatCard = ({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-muted/30',
  valueColor = 'text-[--foreground]',
  trend,
  trendColor = 'text-[--muted-foreground]',
  trendIcon: TrendIcon,
  description,
  className = '',
  titleSize = 'text-[0.55rem] xs:text-xs sm:text-xs md:text-sm',
  valueSize = 'text-base xs:text-lg sm:text-lg md:text-xl lg:text-2xl',
  trendSize = 'text-[0.5rem] xs:text-[0.6rem] sm:text-[0.6rem] md:text-xs'
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBgColor?: string;
  valueColor?: string;
  trend?: string;
  trendColor?: string;
  trendIcon?: React.ElementType;
  description?: string;
  className?: string;
  titleSize?: string;
  valueSize?: string;
  trendSize?: string;
}) => (
  <div
    className={cn(
      'flex flex-col rounded-md border border-[--border-hover] bg-[--card] p-2 shadow-sm transition-shadow hover:shadow-md md:rounded-lg md:p-3',
      className
    )}
  >
    <div className='mb-1 flex items-start justify-between md:mb-1.5'>
      <p className={cn('font-medium text-[--muted-foreground]', titleSize)}>{title}</p>
      <div
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded md:h-6 md:w-6',
          iconBgColor
        )}
      >
        <Icon size={12} className={cn('text-[--muted-foreground]', valueColor)} />
      </div>
    </div>
    <p className={cn('truncate font-bold', valueColor, valueSize)}>{value}</p>
    {description && (
      <p className={cn('mt-0.5 text-[--muted-foreground]', trendSize)}>{description}</p>
    )}
    {trend && TrendIcon && (
      <p className={cn('mt-0.5 flex items-center font-medium md:mt-1', trendColor, trendSize)}>
        <TrendIcon size={10} className='mr-0.5 md:size-3' /> {trend}
      </p>
    )}
  </div>
);

const MockupChartCard = ({
  title,
  icon: Icon,
  children,
  className
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'flex flex-col rounded-md border border-[--border-hover] bg-[--card] p-2 shadow-sm md:rounded-lg md:p-3',
      className
    )}
  >
    <div className='mb-1.5 flex items-center justify-between md:mb-2'>
      <p className='text-xs font-medium text-[--muted-foreground] md:text-sm'>{title}</p>
      <Icon size={14} className='text-[--muted-foreground] md:size-4' />
    </div>
    {children}
  </div>
);

const DashboardMockup = () => {
  const sidebarItems = [
    { icon: LayoutGrid, active: true, label: 'Dashboard' },
    { icon: CreditCard, label: 'Accounts' },
    { icon: Users, label: 'Shared' },
    { icon: ReceiptText, label: 'Transactions' },
    { icon: PieChartIcon, label: 'Budgets' },
    { icon: PiggyBank, label: 'Goals' },
    { icon: WalletCards, label: 'Investments' },
    { icon: Scale, label: 'Debts' }
  ];

  return (
    <div className='pointer-events-none mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-[--border] bg-[--background] p-1.5 shadow-2xl select-none md:max-w-4xl md:p-2 lg:max-w-5xl'>
      <div className='grid h-auto min-h-[300px] grid-cols-12 gap-1.5 md:min-h-[400px] md:gap-2 lg:min-h-[450px]'>
        {/* Sidebar Mock - More detailed */}
        <div className='col-span-3 flex flex-col rounded-md border border-[--border-active] bg-[--card] p-1 shadow-inner max-sm:col-span-1 md:p-1.5 lg:p-2'>
          <div className='mb-1.5 flex items-center gap-1 p-0.5 md:mb-2 md:gap-1.5 md:p-1'>
            <Image
              src='/favicon.svg'
              alt='Logo'
              width={16}
              height={16}
              className='h-4 w-4 opacity-90 md:h-5 md:w-5'
            />
            <div className='hidden text-xs font-semibold text-[--foreground] md:block lg:text-sm'>
              Expense Pro
            </div>
          </div>

          <div className='flex-grow space-y-0.5 md:space-y-1'>
            {sidebarItems.map((item, i) => (
              <div
                key={i}
                className={cn(
                  'flex h-5 items-center gap-1 rounded p-0.5 text-[0.6rem] transition-colors md:h-6 md:gap-1.5 md:p-1 md:text-xs lg:h-7 lg:text-sm',
                  item.active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'bg-transparent text-[--muted-foreground] hover:bg-[--muted]/50 hover:text-[--foreground]'
                )}
              >
                <item.icon size={10} className='shrink-0 md:size-3 lg:size-4' />
                <span className='hidden truncate md:inline-block'>{item.label}</span>
              </div>
            ))}
          </div>
          <div className='mt-auto border-t border-[--border-active] p-1 pt-1 md:p-1.5 md:pt-1.5'>
            <div className='flex h-5 items-center gap-1 rounded p-0.5 text-[0.6rem] text-[--muted-foreground] hover:bg-[--muted]/50 hover:text-[--foreground] md:h-6 md:gap-1.5 md:p-1 md:text-xs lg:h-7 lg:text-sm'>
              <Settings size={10} className='shrink-0 md:size-3 lg:size-4' />
              <span className='hidden truncate md:inline-block'>Settings</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='col-span-9 flex flex-col space-y-1.5 overflow-hidden rounded-md border border-[--border-active] bg-[--muted]/20 p-1.5 max-sm:col-span-11 md:space-y-2 md:p-2'>
          <div className='mb-1 flex items-center justify-between px-1 md:px-1.5'>
            <h2 className='text-sm font-semibold text-[--foreground] md:text-base lg:text-lg'>
              Dashboard
            </h2>
            <MoreVertical size={14} className='text-[--muted-foreground] md:size-4' />
          </div>

          {/* Top Row: Health & Snapshot */}
          <div className='grid grid-cols-1 gap-1.5 md:grid-cols-2 md:gap-2'>
            <MockupStatCard
              title='Financial Health'
              value='85/100'
              description='Great shape!'
              icon={ShieldCheck}
              iconBgColor='bg-success/10'
              valueColor='text-success'
              className='h-auto min-h-[60px] md:min-h-[70px]'
            />
            <MockupStatCard
              title='Overall Net Balance'
              value='₹1,30,816'
              description='+2.5% this month'
              icon={IndianRupee}
              iconBgColor='bg-primary/10'
              valueColor='text-primary'
              trend='+₹3,200'
              trendColor='text-success'
              trendIcon={TrendingUp}
              className='h-auto min-h-[60px] md:min-h-[70px]'
            />
          </div>

          {/* Second Row: Trends & Spending */}
          <div className='grid grid-cols-3 gap-1.5 md:gap-2'>
            <MockupChartCard
              title='Financial Trends (30D)'
              icon={TrendingUp}
              className='col-span-2 h-[90px] md:h-[110px] lg:h-[130px]'
            >
              <div className='relative h-full w-full overflow-hidden'>
                <svg
                  viewBox='0 0 100 35'
                  preserveAspectRatio='none'
                  className='absolute inset-0 h-full w-full'
                >
                  <path
                    d='M0 28 C10 18, 20 30, 30 20 S40 5, 50 12 S60 28, 70 18 S80 30, 90 20 S100 8, 100 8'
                    fill='none'
                    stroke='var(--chart-balance)'
                    strokeWidth='0.8'
                  />
                  <path
                    d='M0 30 C15 25, 25 35, 40 25 S55 12, 65 20 S75 33, 85 23 S100 15, 100 15'
                    fill='var(--chart-income)'
                    fillOpacity={0.03}
                    stroke='var(--chart-income)'
                    strokeWidth='0.6'
                  />
                  <path
                    d='M0 33 C20 30, 30 34, 45 27 S60 20, 70 25 S80 30, 90 33 S100 25, 100 25'
                    fill='var(--chart-expense)'
                    fillOpacity={0.03}
                    stroke='var(--chart-expense)'
                    strokeWidth='0.6'
                  />
                </svg>
              </div>
            </MockupChartCard>
            <MockupChartCard
              title='Spending Breakdown'
              icon={PieChartIcon}
              className='col-span-1 h-[90px] md:h-[110px] lg:h-[130px]'
            >
              <div className='flex h-full items-center justify-center'>
                <svg viewBox='0 0 36 36' className='h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20'>
                  <circle
                    cx='18'
                    cy='18'
                    r='15.915'
                    fill='none'
                    className='stroke-muted/30'
                    strokeWidth='2.5'
                  ></circle>
                  <circle
                    cx='18'
                    cy='18'
                    r='15.915'
                    fill='none'
                    className='stroke-[var(--chart-1)]'
                    strokeWidth='2.5'
                    strokeDasharray='60, 100'
                  ></circle>
                  <circle
                    cx='18'
                    cy='18'
                    r='15.915'
                    fill='none'
                    className='stroke-[var(--chart-2)]'
                    strokeWidth='2.5'
                    strokeDasharray='25, 100'
                    strokeDashoffset='-60'
                  ></circle>
                </svg>
              </div>
            </MockupChartCard>
          </div>

          {/* Third Row: Smaller Cards */}
          <div className='grid grid-cols-2 gap-1.5 md:grid-cols-4 md:gap-2'>
            <MockupStatCard
              title='Budget: Groceries'
              value='60%'
              description='₹12k/₹20k'
              icon={ReceiptText}
              className='h-auto min-h-[55px] md:min-h-[65px]'
            />
            <MockupStatCard
              title='Goal: Vacation'
              value='25%'
              description='₹25k/₹100k'
              icon={PiggyBank}
              className='h-auto min-h-[55px] md:min-h-[65px]'
            />
            <MockupStatCard
              title='Investments'
              value='₹75,320'
              description='+1.8%'
              icon={Banknote}
              iconBgColor='bg-indigo-500/10'
              valueColor='text-indigo-400'
              trendColor='text-success'
              trendIcon={TrendingUp}
              className='h-auto min-h-[55px] md:min-h-[65px]'
            />
            <MockupStatCard
              title='Debts'
              value='₹15,000'
              description='2 active'
              icon={Scale}
              valueColor='text-destructive'
              className='h-auto min-h-[55px] md:min-h-[65px]'
            />
          </div>

          {/* Fourth Row: Recent Activity */}
          <div className='grid grid-cols-1 gap-1 rounded-md border border-[--border-hover] bg-[--card] p-1.5 shadow-sm md:p-2'>
            <div className='text-xs font-medium text-[--muted-foreground] md:text-sm'>
              Recent Activity
            </div>
            <div className='space-y-0.5 md:space-y-1'>
              <div className='flex items-center justify-between text-[0.55rem] md:text-xs'>
                <span className='text-[--muted-foreground]'>Swiggy Order</span>
                <Badge
                  variant='destructive'
                  className='h-4 rounded-sm px-1 py-0 text-[0.5rem] font-normal md:text-[0.55rem]'
                >
                  - ₹350
                </Badge>
              </div>
              <div className='flex items-center justify-between text-[0.55rem] md:text-xs'>
                <span className='text-[--muted-foreground]'>Salary Credit</span>
                <Badge
                  variant='default'
                  className='bg-success/80 h-4 rounded-sm px-1 py-0 text-[0.5rem] font-normal md:text-[0.55rem]'
                >
                  + ₹50,000
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
