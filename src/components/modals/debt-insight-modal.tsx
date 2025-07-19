'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isAfter } from 'date-fns';
import {
  CheckCircle,
  X,
  TrendingUp,
  Clock,
  IndianRupee,
  User,
  AlertTriangle,
  Calendar,
  Percent,
  type LucideProps
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

import { DebtWithDetails, Payment } from '@/lib/types';
import { getDebtSchedule } from '@/lib/endpoints/debt';
import { formatCurrency, cn } from '@/lib/utils';

import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TimelineScroller } from '../debt/timeline-scroller';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import NoData from '../ui/no-data';

interface DebtInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debt: DebtWithDetails;
}

const StatusBadge = React.memo(
  ({
    isPaid,
    isOverdue,
    className
  }: {
    isPaid: boolean;
    isOverdue: boolean;
    className?: string;
  }) => {
    if (isPaid) {
      return (
        <Badge variant='success' className={cn('gap-1.5', className)}>
          <CheckCircle className='h-3 w-3' />
          Settled
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge variant='destructive' className={cn('gap-1.5', className)}>
          <AlertTriangle className='h-3 w-3' />
          Overdue
        </Badge>
      );
    }
    return (
      <Badge variant='info' className={cn('gap-1.5', className)}>
        <Clock className='h-3 w-3' />
        Active
      </Badge>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

const MetricCard = React.memo(
  ({
    title,
    value,
    icon: Icon,
    isLoading,
    subValue
  }: {
    title: string;
    value: React.ReactNode;
    icon: React.ElementType<LucideProps>;
    isLoading: boolean;
    subValue?: string;
  }) => (
    <Card>
      <CardHeader className='relative flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>{title}</CardTitle>
        <div className='bg-background/50 absolute -top-2 -right-2 rounded-full border p-2 backdrop-blur-sm'>
          <Icon className='text-accent-foreground bg-background/50 h-5 w-5 rounded-full' />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='mt-1 h-8 w-24' />
        ) : (
          <div className='text-2xl font-bold'>{value}</div>
        )}
        {subValue && <p className='text-muted-foreground text-xs'>{subValue}</p>}
      </CardContent>
    </Card>
  )
);
MetricCard.displayName = 'MetricCard';

const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className='bg-background/95 min-w-[200px] rounded-lg border p-3 shadow-lg backdrop-blur-sm'>
      <div className='space-y-2'>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <div
                className='h-2.5 w-2.5 flex-shrink-0 rounded-full'
                style={{ backgroundColor: entry.payload.color }}
              />
              <span className='text-foreground text-sm font-medium'>{entry.name}</span>
            </div>
            <span className='text-foreground text-sm font-semibold'>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
CustomTooltip.displayName = 'CustomTooltip';

const DebtInsightModal: React.FC<DebtInsightModalProps> = ({ isOpen, onOpenChange, debt }) => {
  const resolvedChartColors = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        'Principal Paid': '#8884d8',
        'Interest Paid': '#82ca9d',
        'Remaining Principal': '#ffc658'
      };
    }
    const style = getComputedStyle(document.documentElement);
    return {
      'Principal Paid': style.getPropertyValue('--chart-1').trim(),
      'Interest Paid': style.getPropertyValue('--chart-2').trim(),
      'Remaining Principal': style.getPropertyValue('--chart-3').trim()
    };
  }, []);

  const {
    data: paymentSchedule,
    isLoading,
    isError,
    error
  } = useQuery<Payment[]>({
    queryKey: ['debtSchedule', debt.debts.id],
    queryFn: async () => {
      const data = await getDebtSchedule(debt.debts.id);
      return data?.map((p) => ({ ...p, date: parseISO(p.date as any) })) ?? [];
    },
    enabled: isOpen && !!debt.debts.id,
    staleTime: 1000 * 60 * 5,
    retry: 1
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const data = useMemo(() => {
    const calculatedTotalInterest =
      paymentSchedule?.reduce((sum, p) => sum + p.interestForPeriod, 0) || 0;
    const totalPrincipal = debt.debts.amount || 0;
    const totalPayable = totalPrincipal + calculatedTotalInterest;
    const selected = paymentSchedule?.[selectedIndex] || null;
    const breakdownData = selected
      ? {
          principalPaid: selected.cumulativePrincipalPaid,
          interestPaid: selected.cumulativeInterestPaid,
          remainingPrincipal: selected.remainingPrincipal
        }
      : {
          principalPaid: debt.debts.isPaid ? totalPrincipal : 0,
          interestPaid: debt.debts.isPaid ? calculatedTotalInterest : 0,
          remainingPrincipal: debt.debts.isPaid ? 0 : totalPrincipal
        };
    const chartData = [
      {
        name: 'Principal Paid',
        value: breakdownData.principalPaid,
        color: resolvedChartColors['Principal Paid']
      },
      {
        name: 'Interest Paid',
        value: breakdownData.interestPaid,
        color: resolvedChartColors['Interest Paid']
      },
      {
        name: 'Remaining Principal',
        value: breakdownData.remainingPrincipal,
        color: resolvedChartColors['Remaining Principal']
      }
    ].filter((item) => item.value > 0);
    const settledPayments = paymentSchedule?.filter((p) => p.status === 'settled').length || 0;
    const totalPayments = paymentSchedule?.length || 0;
    const progressPercentage = totalPayments > 0 ? (settledPayments / totalPayments) * 100 : 0;
    return {
      breakdownData,
      chartData,
      totalInterest: calculatedTotalInterest,
      totalPayable,
      progressStats: {
        settled: settledPayments,
        total: totalPayments,
        percentage: progressPercentage
      }
    };
  }, [selectedIndex, paymentSchedule, debt.debts, resolvedChartColors]);

  const isOverdue =
    !debt.debts.isPaid && debt.debts.dueDate && isAfter(new Date(), parseISO(debt.debts.dueDate));

  const metrics = [
    {
      title: 'Principal Amount',
      value: formatCurrency(debt.debts.amount || 0),
      icon: IndianRupee,
      subValue: 'Original loan amount'
    },
    {
      title: 'Interest Rate',
      value: `${debt.debts.percentage}%`,
      subValue: `${debt.debts.interestType} interest`,
      icon: Percent
    },
    {
      title: 'Total Interest',
      value: formatCurrency(data.totalInterest),
      icon: TrendingUp,
      isLoading: isLoading,
      subValue: 'Over the loan term'
    },
    {
      title: 'Total Payable',
      value: formatCurrency(data.totalPayable),
      icon: IndianRupee,
      isLoading: isLoading,
      subValue: 'Principal + Interest'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent hideClose className='max-h-[95dvh] w-[98vw] max-w-7xl overflow-y-auto p-0'>
        <div className='flex-shrink-0 border-b px-6 py-4'>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1.5'>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                <DialogTitle className='text-2xl font-bold'>{debt.debts.description}</DialogTitle>
                <StatusBadge isPaid={debt.debts.isPaid} isOverdue={!!isOverdue} />
                <Badge variant='secondary' className='capitalize'>
                  {debt.debts.type}
                </Badge>
              </div>
              {data.progressStats.total > 0 && (
                <p className='text-muted-foreground text-sm'>
                  {data.progressStats.settled} of {data.progressStats.total} payments completed (
                  {Math.round(data.progressStats.percentage)}%)
                </p>
              )}
            </div>
            <DialogClose asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 flex-shrink-0'>
                <X className='h-4 w-4' />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div className='flex flex-1 flex-col overflow-hidden md:flex-row'>
          <aside className='bg-muted/30 w-full flex-shrink-0 overflow-y-auto border-b p-6 md:w-80 md:border-r md:border-b-0'>
            <div className='mb-6'>
              <h3 className='mb-2 text-base font-semibold'>Payment Breakdown</h3>
              <div className='relative'>
                <ResponsiveContainer width='100%' height={240}>
                  <PieChart>
                    <Tooltip cursor={false} content={<CustomTooltip />} />
                    <Pie
                      data={data.chartData}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {data.chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke='var(--muted)'
                          className='focus:outline-none'
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='text-xl font-bold tracking-tight'>
                    {formatCurrency(data.totalPayable)}
                  </span>
                  <span className='text-muted-foreground text-xs'>Total Payable</span>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              {data.chartData.map((item) => (
                <div key={item.name} className='flex items-center justify-between text-sm'>
                  <div className='flex items-center gap-2'>
                    <div
                      className='h-2.5 w-2.5 rounded-full'
                      style={{ backgroundColor: item.color }}
                    />
                    <span className='font-medium'>{item.name}</span>
                  </div>
                  <span className='font-semibold'>{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>

            <div className='mt-6 space-y-3 border-t pt-6'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Duration</span>
                <span className='font-medium capitalize'>{debt.debts.duration}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Frequency</span>
                <span className='font-medium capitalize'>{debt.debts.frequency}</span>
              </div>
              {debt.debts.dueDate && (
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Due Date</span>
                  <span className='font-medium'>
                    {format(parseISO(debt.debts.dueDate), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </aside>

          <main className='flex min-w-0 flex-1 flex-col overflow-hidden'>
            <Tabs defaultValue='timeline' className='flex flex-1 flex-col'>
              <TabsList className='mx-6 mt-6 w-fit flex-shrink-0'>
                <TabsTrigger value='timeline'>Payment Timeline</TabsTrigger>
                <TabsTrigger value='details'>Loan Details</TabsTrigger>
              </TabsList>

              <TabsContent
                value='timeline'
                className='min-w-0 flex-1 space-y-6 overflow-y-auto p-6'
              >
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  {metrics.map((metric) => (
                    <MetricCard
                      key={metric.title}
                      title={metric.title}
                      value={metric.value}
                      icon={metric.icon}
                      isLoading={metric.isLoading ?? false}
                      subValue={metric.subValue}
                    />
                  ))}
                </div>

                {isLoading ? (
                  <div className='space-y-4 p-4'>
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-64 w-full' />
                  </div>
                ) : isError || !paymentSchedule ? (
                  <NoData
                    message={`Unable to generate payment schedule. ${error?.message || ''}`}
                    icon='x-circle'
                  />
                ) : paymentSchedule.length > 0 ? (
                  <TimelineScroller
                    schedule={paymentSchedule}
                    selectedIndex={selectedIndex}
                    onSelect={setSelectedIndex}
                  />
                ) : (
                  <NoData message='No payment schedule available for this debt.' />
                )}
              </TabsContent>

              <TabsContent value='details' className='min-w-0 flex-1 space-y-6 overflow-y-auto p-6'>
                <div className='grid gap-6 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Counterparty Information</CardTitle>
                      <CardDescription>Details about the other party in this debt</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-center gap-4'>
                        <Avatar className='h-12 w-12'>
                          <AvatarImage src={debt.user?.profilePic || undefined} />
                          <AvatarFallback>
                            <User className='h-6 w-6' />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-semibold'>{debt.user?.name || 'Unknown User'}</p>
                          <p className='text-muted-foreground text-sm'>
                            {debt.user?.email || 'No email provided'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Associated Account</CardTitle>
                      <CardDescription>The account this debt is linked to</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <p className='font-semibold'>
                          {debt.account?.name || 'No account specified'}
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          Financial portfolio integration
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='lg:col-span-2'>
                    <CardHeader>
                      <CardTitle>Loan Terms & Conditions</CardTitle>
                      <CardDescription>Complete terms and timeline for this debt</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4'>
                        <div>
                          <p className='text-muted-foreground text-sm font-medium'>Created On</p>
                          <p className='font-semibold'>
                            {debt.debts.createdAt
                              ? format(parseISO(debt.debts.createdAt), 'MMM d, yyyy')
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-sm font-medium'>Due Date</p>
                          <p className='font-semibold'>
                            {debt.debts.dueDate
                              ? format(parseISO(debt.debts.dueDate), 'MMM d, yyyy')
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-sm font-medium'>
                            Payment Frequency
                          </p>
                          <p className='font-semibold capitalize'>{debt.debts.frequency}</p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-sm font-medium'>Loan Duration</p>
                          <p className='font-semibold capitalize'>{debt.debts.duration}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DebtInsightModal;
