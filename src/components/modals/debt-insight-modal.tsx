'use client';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isAfter, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import type { DebtAndInterestAPI } from '@/lib/api/api-types';
import { getDebtSchedule } from '@/lib/endpoints/debt';
import { formatCurrency, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import NoData from '../ui/no-data';
import { Icon } from '../ui/icon';
import { IconName } from '../ui/icon-map';

interface DebtInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debt: DebtAndInterestAPI.DebtRecord;
}

const calculateFinalDueDate = (debt: DebtAndInterestAPI.Debt): Date | null => {
  if (!debt.startDate || !debt.termLength || !debt.termUnit) return null;
  const startDate = new Date(debt.startDate);
  switch (debt.termUnit) {
    case 'days':
      return addDays(startDate, debt.termLength);
    case 'weeks':
      return addWeeks(startDate, debt.termLength);
    case 'months':
      return addMonths(startDate, debt.termLength);
    case 'years':
      return addYears(startDate, debt.termLength);
    default:
      return null;
  }
};

const StatusBadge = React.memo(({ isPaid, isOverdue }: { isPaid: boolean; isOverdue: boolean }) => {
  if (isPaid)
    return (
      <Badge variant='success' className='gap-1.5'>
        <Icon name='checkCircle' className='h-3.5 w-3.5' /> Settled
      </Badge>
    );
  if (isOverdue)
    return (
      <Badge variant='destructive' className='gap-1.5'>
        <Icon name='alertTriangle' className='h-3.5 w-3.5' /> Overdue
      </Badge>
    );
  return (
    <Badge variant='secondary' className='gap-1.5'>
      <Icon name='clock' className='h-3.5 w-3.5' /> Active
    </Badge>
  );
});
StatusBadge.displayName = 'StatusBadge';

const MetricItem = React.memo(
  ({ title, value, icon }: { title: string; value: React.ReactNode; icon: IconName }) => (
    <div className='flex flex-col gap-1'>
      <p className='text-muted-foreground flex items-center gap-1.5 text-sm'>
        <Icon name={icon} className='h-3.5 w-3.5' />
        {title}
      </p>
      <p className='text-foreground text-lg font-semibold sm:text-xl'>{value}</p>
    </div>
  )
);
MetricItem.displayName = 'MetricItem';

const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className='bg-popover min-w-[180px] rounded-lg border p-2 shadow-sm'>
      <div className='space-y-1.5'>
        {payload.map((entry: any) => (
          <div key={entry.name} className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <div
                className='h-2.5 w-2.5 flex-shrink-0 rounded-full'
                style={{ backgroundColor: entry.payload.color }}
              />
              <span className='text-muted-foreground text-sm'>{entry.name}</span>
            </div>
            <span className='text-sm font-semibold'>{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
CustomTooltip.displayName = 'CustomTooltip';

const TimelineTick = React.memo(
  ({
    payment,
    index,
    isSelected,
    onSelect,
    isLast,
    isSettled
  }: {
    payment: DebtAndInterestAPI.AmortizationPayment;
    index: number;
    isSelected: boolean;
    onSelect: (index: number) => void;
    isLast: boolean;
    isSettled: boolean;
  }) => {
    const isDue = payment.status === 'due';
    const isUpcoming = payment.status === 'upcoming';

    return (
      <div
        className='group relative flex cursor-pointer flex-col items-center py-2'
        onClick={() => onSelect(index)}
      >
        <div
          className={cn('bg-border absolute top-4 left-3/4 z-0 h-0.5 w-full', isLast && 'hidden')}
        >
          <div className={cn('h-full', isSettled ? 'bg-success' : 'bg-border')} />
        </div>
        <div
          className={cn(
            'relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200',
            isSelected
              ? 'ring-offset-background scale-110 ring-2 ring-offset-2'
              : 'group-hover:scale-105',
            isSettled &&
              (isSelected ? 'bg-success ring-success' : 'bg-success/50 border-success border'),
            isDue &&
              (isSelected
                ? 'bg-destructive ring-destructive'
                : 'bg-destructive/50 border-destructive border'),
            isUpcoming && (isSelected ? 'bg-primary ring-primary' : 'bg-muted border-border border')
          )}
        >
          {isSettled && <Icon name='check' className='text-success-foreground h-3 w-3' />}
        </div>
        <p
          className={cn(
            'mt-2 text-center text-[11px] font-medium whitespace-nowrap transition-colors',
            isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'
          )}
        >
          {format(payment.date, 'MMM yy')}
        </p>
      </div>
    );
  }
);
TimelineTick.displayName = 'TimelineTick';

const ModalSkeleton = () => (
  <div className='flex h-full flex-col'>
    <div className='border-b p-4 sm:p-6'>
      <div className='flex items-start justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-7 w-40 sm:w-56' />
          <Skeleton className='h-4 w-24 sm:w-32' />
        </div>
        <Skeleton className='h-8 w-8 rounded-md' />
      </div>
      <div className='mt-4 space-y-2'>
        <Skeleton className='h-2 w-full' />
      </div>
    </div>
    <div className='border-b p-4 sm:p-6'>
      <div className='grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4'>
        <Skeleton className='h-12 w-32' />
        <Skeleton className='h-12 w-24' />
        <Skeleton className='h-12 w-28' />
        <Skeleton className='h-12 w-36' />
      </div>
      <Skeleton className='mt-4 h-10 w-48' />
    </div>
    <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
      <div className='space-y-6'>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Skeleton className='h-56 md:col-span-1' />
          <Skeleton className='h-56 md:col-span-2' />
        </div>
      </div>
    </div>
  </div>
);

const DebtInsightModal: React.FC<DebtInsightModalProps> = ({ isOpen, onOpenChange, debt }) => {
  const finalDueDate = useMemo(() => calculateFinalDueDate(debt.debts), [debt.debts]);
  const isOverdue = !debt.debts.isPaid && finalDueDate && isAfter(new Date(), finalDueDate);

  const {
    data: paymentSchedule,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['debtSchedule', debt.debts.id],
    queryFn: async () => {
      const data = await getDebtSchedule(debt.debts.id);
      return data?.map((p: any) => ({ ...p, date: parseISO(p.date) })) ?? [];
    },
    enabled: isOpen && !!debt.debts.id,
    staleTime: 1000 * 60 * 5
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const data = useMemo(() => {
    const totalPrincipal = debt.debts.amount || 0;
    const totalInterest = paymentSchedule?.reduce((sum, p) => sum + p.interestForPeriod, 0) || 0;
    const totalPayable = totalPrincipal + totalInterest;
    const principalPaid =
      paymentSchedule?.[selectedIndex]?.cumulativePrincipalPaid ??
      (debt.debts.isPaid ? totalPrincipal : 0);
    const interestPaid =
      paymentSchedule?.[selectedIndex]?.cumulativeInterestPaid ??
      (debt.debts.isPaid ? totalInterest : 0);
    const remainingPrincipal =
      paymentSchedule?.[selectedIndex]?.remainingPrincipal ??
      (debt.debts.isPaid ? 0 : totalPrincipal);
    const chartData = [
      { name: 'Principal Paid', value: principalPaid, color: 'var(--color-chart-1)' },
      { name: 'Interest Paid', value: interestPaid, color: 'var(--color-chart-4)' },
      { name: 'Remaining', value: remainingPrincipal, color: 'var(--color-chart-other)' }
    ].filter((item) => item.value > 0);
    const settledPayments = paymentSchedule?.filter((p) => p.status === 'settled').length || 0;
    const totalPayments = paymentSchedule?.length || 0;
    const progressPercentage = totalPayments > 0 ? (settledPayments / totalPayments) * 100 : 0;
    return {
      chartData,
      totalInterest,
      totalPayable,
      progressPercentage,
      settledPayments,
      totalPayments
    };
  }, [selectedIndex, paymentSchedule, debt.debts]);

  const selectedPayment = paymentSchedule?.[selectedIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className='flex max-h-[90dvh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0'
      >
        {isLoading ? (
          <ModalSkeleton />
        ) : (
          <div className='flex h-full flex-col overflow-y-scroll'>
            <header className='flex-shrink-0 border-b p-4 sm:p-6'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1 space-y-2.5'>
                  <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                    <DialogTitle className='truncate text-lg font-semibold sm:text-xl'>
                      {debt.debts.description}
                    </DialogTitle>
                    <div className='flex items-center gap-2'>
                      <StatusBadge isPaid={!!debt.debts.isPaid} isOverdue={!!isOverdue} />
                      <Badge variant='outline' className='capitalize'>
                        {debt.debts.type}
                      </Badge>
                    </div>
                  </div>
                  {data.totalPayments > 0 && (
                    <div>
                      <div className='text-muted-foreground mb-1 flex justify-between text-xs font-medium'>
                        <span>Progress</span>
                        <span>
                          {data.settledPayments} / {data.totalPayments} Payments
                        </span>
                      </div>
                      <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                        <div
                          className='bg-success h-full rounded-full transition-all'
                          style={{ width: `${data.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogClose asChild>
                  <Button variant='ghost' size='icon' className='-m-2 h-8 w-8 flex-shrink-0'>
                    <Icon name='x' className='h-4 w-4' />
                  </Button>
                </DialogClose>
              </div>
            </header>

            <div className='flex-1'>
              <Tabs defaultValue='timeline'>
                <div className='bg-background/80 sticky top-0 z-10 border-b p-4 backdrop-blur-sm sm:p-6'>
                  <div className='mb-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4'>
                    <MetricItem
                      title='Principal Amount'
                      value={formatCurrency(debt.debts.amount || 0)}
                      icon='indianRupee'
                    />
                    <MetricItem
                      title='Interest Rate'
                      value={`${debt.debts.interestRate}%`}
                      icon='percent'
                    />
                    <MetricItem
                      title='Total Interest'
                      value={formatCurrency(data.totalInterest)}
                      icon='trendingUp'
                    />
                    <MetricItem
                      title='Total Payable'
                      value={formatCurrency(data.totalPayable)}
                      icon='indianRupee'
                    />
                  </div>
                  <TabsList>
                    <TabsTrigger value='timeline'>
                      <Icon name='calendar' className='mr-2 h-4 w-4' />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value='details'>
                      <Icon name='fileText' className='mr-2 h-4 w-4' />
                      Details
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value='timeline' className='mt-0 space-y-6 p-4 sm:p-6'>
                  {isError || !paymentSchedule ? (
                    <NoData
                      message={`Unable to generate payment schedule. ${error?.message || ''}`}
                      icon='xCircle'
                    />
                  ) : paymentSchedule.length > 0 ? (
                    <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
                      <div className='space-y-4 md:col-span-1'>
                        <h3 className='text-foreground font-semibold'>Payment Breakdown</h3>
                        <div className='relative'>
                          <ResponsiveContainer width='100%' height={160}>
                            <RechartsPieChart>
                              <Tooltip cursor={false} content={<CustomTooltip />} />
                              <Pie
                                data={data.chartData}
                                dataKey='value'
                                nameKey='name'
                                cx='50%'
                                cy='50%'
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={3}
                                stroke='none'
                              >
                                {data.chartData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.color} />
                                ))}
                              </Pie>
                            </RechartsPieChart>
                          </ResponsiveContainer>
                          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
                            <span className='text-lg font-bold'>
                              {formatCurrency(selectedPayment?.installmentAmount)}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              Installment #{selectedIndex + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='space-y-4 md:col-span-2'>
                        <h3 className='text-foreground font-semibold'>Payment Timeline</h3>
                        <div>
                          <div className='scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6'>
                            {paymentSchedule.map((payment, index) => (
                              <TimelineTick
                                key={payment.date.toISOString()}
                                payment={payment}
                                index={index}
                                isSelected={selectedIndex === index}
                                onSelect={setSelectedIndex}
                                isLast={index === paymentSchedule.length - 1}
                                isSettled={payment.status === 'settled'}
                              />
                            ))}
                          </div>
                          {selectedPayment && (
                            <div className='bg-muted/50 mt-2 rounded-lg p-4'>
                              <div className='grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3'>
                                <div>
                                  <p className='text-muted-foreground'>Amount</p>
                                  <p className='font-semibold'>
                                    {formatCurrency(selectedPayment.installmentAmount)}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-muted-foreground'>Principal</p>
                                  <p className='font-semibold'>
                                    {formatCurrency(selectedPayment.principalForPeriod)}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-muted-foreground'>Interest</p>
                                  <p className='font-semibold'>
                                    {formatCurrency(selectedPayment.interestForPeriod)}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-muted-foreground'>Date</p>
                                  <p className='font-semibold'>
                                    {format(selectedPayment.date, 'PP')}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-muted-foreground'>Balance</p>
                                  <p className='font-semibold'>
                                    {formatCurrency(selectedPayment.remainingPrincipal)}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-muted-foreground'>Status</p>
                                  <p
                                    className={cn(
                                      'font-semibold capitalize',
                                      selectedPayment.status === 'settled'
                                        ? 'text-success'
                                        : selectedPayment.status === 'due'
                                          ? 'text-destructive'
                                          : 'text-muted-foreground'
                                    )}
                                  >
                                    {selectedPayment.status}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <NoData message='No payment schedule available for this debt.' />
                  )}
                </TabsContent>

                <TabsContent value='details' className='mt-0 p-4 sm:p-6'>
                  <div className='space-y-8'>
                    <div className='grid grid-cols-1 gap-8 sm:grid-cols-2'>
                      <div>
                        <h3 className='mb-3 border-b pb-2 text-base font-semibold'>Counterparty</h3>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-10 w-10'>
                            <AvatarImage src={debt.user?.image || undefined} />
                            <AvatarFallback>
                              <Icon name='user' className='h-4 w-4' />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-semibold'>{debt.user?.name || 'Unknown'}</p>
                            <p className='text-muted-foreground text-sm'>
                              {debt.user?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-3 border-b pb-2 text-base font-semibold'>
                          Associated Account
                        </h3>
                        <div>
                          <p className='font-semibold'>{debt.account?.name || 'N/A'}</p>
                          <p className='text-muted-foreground text-sm'>
                            Financial portfolio integration
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className='mb-4 border-b pb-2 text-base font-semibold'>Loan Terms</h3>
                      <div className='grid grid-cols-2 gap-x-4 gap-y-5 text-sm sm:grid-cols-4'>
                        <div>
                          <p className='text-muted-foreground'>Start Date</p>
                          <p className='font-semibold'>
                            {debt.debts.startDate
                              ? format(new Date(debt.debts.startDate), 'PP')
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-muted-foreground'>Final Due Date</p>
                          <p className='font-semibold'>
                            {finalDueDate ? format(finalDueDate, 'PP') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-muted-foreground'>Payment Frequency</p>
                          <p className='font-semibold capitalize'>
                            {debt.debts.paymentFrequency || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-muted-foreground'>Loan Term</p>
                          <p className='font-semibold capitalize'>
                            {debt.debts.termLength
                              ? `${debt.debts.termLength} ${debt.debts.termUnit}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DebtInsightModal;
