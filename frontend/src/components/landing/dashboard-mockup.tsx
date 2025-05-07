'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChartHorizontalBig,
  PieChart as PieChartIcon,
  LayoutGrid,
  Settings,
  CreditCard,
  Repeat,
  CalendarRange,
  Target,
  Briefcase,
  ListFilter,
  Coins
} from 'lucide-react';
import Image from 'next/image';

const MockupStatCard = ({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-slate-600/50',
  valueColor = 'text-slate-50',
  trend,
  trendColor,
  trendIcon: TrendIcon,
  className = ''
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBgColor?: string;
  valueColor?: string;
  trend?: string;
  trendColor?: string;
  trendIcon?: React.ElementType;
  className?: string;
}) => (
  <div className={cn('flex flex-col rounded-lg bg-slate-700/30 p-3 shadow-md md:p-4', className)}>
    <div className='mb-2 flex items-center justify-between'>
      <p className='text-[0.6rem] font-medium text-slate-400 md:text-xs'>{title}</p>
      <div
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full md:h-6 md:w-6',
          iconBgColor
        )}
      >
        <Icon
          size={12}
          className={cn(
            valueColor === 'text-slate-50' ? 'text-slate-300' : valueColor,
            'md:size-3'
          )}
        />
      </div>
    </div>
    <p className={cn('truncate text-lg font-bold md:text-xl lg:text-2xl', valueColor)}>{value}</p>
    {trend && TrendIcon && (
      <p className={cn('mt-1 flex items-center text-[0.6rem] font-medium md:text-xs', trendColor)}>
        <TrendIcon size={10} className='mr-0.5 md:size-3' /> {trend}
      </p>
    )}
  </div>
);

const MockupMainChartArea = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className='flex flex-col rounded-lg bg-slate-700/30 p-3 shadow-md md:p-4'>
    <div className='mb-2 flex items-center justify-between'>
      <p className='text-[0.6rem] font-medium text-slate-400 md:text-xs'>{title}</p>
      <Icon size={14} className='text-slate-500 md:size-4' />
    </div>
    <div className='flex h-full min-h-[80px] flex-grow items-end justify-around gap-1 overflow-hidden rounded-md bg-slate-600/20 p-2 md:min-h-[120px] md:gap-1.5'>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 rounded-t-sm bg-sky-500/70 md:w-2 lg:w-2.5',
            i % 3 === 0 && 'animate-pulse delay-100',
            i % 3 === 1 && 'animate-pulse delay-200',
            i % 3 === 2 && 'animate-pulse delay-300'
          )}
          style={{ height: `${10 + Math.random() * 70}%` }}
        />
      ))}
    </div>
  </div>
);

const MockupDonutChartArea = ({
  title,
  icon: Icon
}: {
  title: string;
  icon: React.ElementType;
}) => (
  <div className='flex flex-col rounded-lg bg-slate-700/30 p-3 shadow-md md:p-4'>
    <div className='mb-2 flex items-center justify-between'>
      <p className='text-[0.6rem] font-medium text-slate-400 md:text-xs'>{title}</p>
      <Icon size={14} className='text-slate-500 md:size-4' />
    </div>
    <div className='flex h-full min-h-[80px] flex-grow items-center justify-center rounded-md bg-slate-600/20 p-2 md:min-h-[120px]'>
      <svg viewBox='0 0 36 36' className='h-16 w-16 animate-pulse md:h-20 md:w-20 lg:h-24 lg:w-24'>
        <circle
          cx='18'
          cy='18'
          r='15.915'
          fill='none'
          className='stroke-slate-500/50'
          strokeWidth='3.5'
        ></circle>
        <circle
          cx='18'
          cy='18'
          r='15.915'
          fill='none'
          className='stroke-sky-500'
          strokeWidth='3.5'
          strokeDasharray='65, 100'
          strokeDashoffset='-0'
        ></circle>
        <circle
          cx='18'
          cy='18'
          r='15.915'
          fill='none'
          className='stroke-emerald-500'
          strokeWidth='3.5'
          strokeDasharray='20, 100'
          strokeDashoffset='-65'
        ></circle>
        <circle
          cx='18'
          cy='18'
          r='15.915'
          fill='none'
          className='stroke-rose-500'
          strokeWidth='3.5'
          strokeDasharray='15, 100'
          strokeDashoffset='-85'
        ></circle>
      </svg>
    </div>
  </div>
);

const MockupBottomWidget = ({
  title,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-slate-400',
  progress,
  progressColor = 'bg-sky-500'
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  iconColor?: string;
  progress?: number;
  progressColor?: string;
}) => (
  <div className='flex flex-col rounded-lg bg-slate-700/30 p-2 shadow-md md:p-2.5'>
    <div className='mb-1 flex items-center gap-1.5'>
      <Icon size={12} className={cn(iconColor, 'md:size-3')} />
      <p className='truncate text-[0.55rem] font-medium text-slate-300 md:text-xs'>{title}</p>
    </div>
    <p className='truncate text-xs font-semibold text-slate-100 md:text-sm'>{value}</p>
    {subValue && (
      <p className='mt-0.5 truncate text-[0.5rem] text-slate-400 md:text-[0.6rem]'>{subValue}</p>
    )}
    {progress !== undefined && (
      <div className='mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-600/50 md:h-1.5'>
        <div
          className={cn('h-full rounded-full', progressColor)}
          style={{ width: `${progress}%` }}
        />
      </div>
    )}
  </div>
);

const DashboardMockup = () => {
  const sidebarItems = [
    { icon: LayoutGrid, active: true },
    { icon: CreditCard },
    { icon: Repeat },
    { icon: BarChartHorizontalBig },
    { icon: PieChartIcon },
    { icon: Briefcase },
    { icon: Coins }
  ];

  return (
    <div className='pointer-events-none h-full w-full overflow-hidden rounded-lg border border-slate-600/50 bg-slate-800 p-1.5 shadow-2xl select-none md:p-2.5'>
      {/* Top bar */}
      <div className='mb-1.5 flex h-5 items-center rounded-t-sm bg-slate-700/60 px-2 md:mb-2 md:h-6'>
        <div className='flex gap-1 md:gap-1.5'>
          <span className='h-2 w-2 rounded-full bg-slate-500/50 md:h-2.5 md:w-2.5'></span>
          <span className='h-2 w-2 rounded-full bg-slate-500/50 md:h-2.5 md:w-2.5'></span>
          <span className='h-2 w-2 rounded-full bg-slate-500/50 md:h-2.5 md:w-2.5'></span>
        </div>
      </div>

      <div className='grid h-[calc(100%-1.5rem)] grid-cols-12 gap-1.5 md:h-[calc(100%-2rem)] md:gap-2.5'>
        {/* Sidebar Mock */}
        <div className='col-span-1 flex flex-col items-center space-y-2 rounded-md bg-slate-700/20 py-2 shadow-inner md:col-span-1 md:space-y-3 md:py-3'>
          <Image
            src='/favicon.svg'
            alt='Logo'
            width={16}
            height={16}
            className='opacity-80 md:h-5 md:w-5'
          />
          <div className='mt-1 h-px w-3/4 bg-slate-600/70 md:mt-2'></div>
          {sidebarItems.map((item, i) => (
            <div
              key={i}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded p-0.5 transition-colors md:h-6 md:w-6',
                item.active ? 'bg-sky-500/30' : 'bg-slate-600/40 hover:bg-slate-600/60'
              )}
            >
              <item.icon
                size={10}
                className={cn(item.active ? 'text-sky-300' : 'text-slate-400', 'md:size-3')}
              />
            </div>
          ))}
          <div className='flex-grow'></div> {/* Spacer */}
          <div className='h-px w-3/4 bg-slate-600/70'></div>
          <div className='flex h-5 w-5 items-center justify-center rounded bg-slate-600/40 p-0.5 hover:bg-slate-600/60 md:h-6 md:w-6'>
            <Settings size={10} className='text-slate-400 md:size-3' />
          </div>
        </div>

        {/* Main Content Area */}
        <div className='col-span-11 flex flex-col space-y-1.5 overflow-hidden md:col-span-11 md:space-y-2.5'>
          {/* Stat Cards Row */}
          <div className='grid grid-cols-3 gap-1.5 md:gap-2.5'>
            <MockupStatCard
              title='Net Balance'
              value='₹1,05,234.50'
              icon={DollarSign}
              iconBgColor='bg-emerald-500/20'
              valueColor='text-emerald-300'
              trend='+3.2% this month'
              trendColor='text-emerald-400/80'
              trendIcon={TrendingUp}
            />
            <MockupStatCard
              title='Total Income'
              value='₹45,670.00'
              icon={TrendingUp}
              iconBgColor='bg-green-500/20'
              valueColor='text-green-300'
              trend='Current Month'
              trendColor='text-slate-400'
            />
            <MockupStatCard
              title='Total Expenses'
              value='₹22,105.75'
              icon={TrendingDown}
              iconBgColor='bg-rose-500/20'
              valueColor='text-rose-300'
              trend='Current Month'
              trendColor='text-slate-400'
            />
          </div>

          {/* Main Chart & Side Widgets Row */}
          <div className='grid min-h-[100px] flex-grow grid-cols-3 gap-1.5 md:min-h-[150px] md:gap-2.5 lg:min-h-[180px]'>
            <MockupMainChartArea title='Income vs Expense Trend' icon={BarChartHorizontalBig} />
            <MockupDonutChartArea title='Spending by Category' icon={PieChartIcon} />
          </div>

          {/* Bottom Row Widgets */}
          <div className='grid grid-cols-4 gap-1.5 md:gap-2.5'>
            <MockupBottomWidget
              title='Budget: Groceries'
              value='₹3,500 / ₹5,000'
              icon={CalendarRange}
              iconColor='text-lime-400'
              progress={70}
              progressColor='bg-lime-500/80'
            />
            <MockupBottomWidget
              title='Goal: Vacation'
              value='₹25,000 / ₹1,00,000'
              icon={Target}
              iconColor='text-purple-400'
              progress={25}
              progressColor='bg-purple-500/80'
            />
            <MockupBottomWidget
              title='Portfolio Value'
              value='₹8,76,500'
              icon={Briefcase}
              iconColor='text-indigo-400'
              progress={60}
              progressColor='bg-indigo-500/80'
            />
            <MockupBottomWidget
              title='Quick Stats'
              value='Highest Exp: ₹12,000'
              subValue='Total Accounts: 5'
              icon={ListFilter}
              iconColor='text-teal-400'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
