'use client';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isAfter, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import {
  CheckCircle,
  X,
  TrendingUp,
  Clock,
  IndianRupee,
  User,
  AlertTriangle,
  Percent,
  type LucideProps,
  Calendar,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import type { DebtAndInterestAPI } from '@/lib/api/api-types';
import { getDebtSchedule } from '@/lib/endpoints/debt';
import { formatCurrency, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import NoData from '../ui/no-data';
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
    if (isPaid)
      return (
        <Badge
          variant='outline'
          className={cn('border-positive/30 bg-positive/10 text-positive gap-1.5', className)}
        >
          <CheckCircle className='h-3 w-3' />
          Settled
        </Badge>
      );
    if (isOverdue)
      return (
        <Badge variant='destructive' className={cn('gap-1.5', className)}>
          <AlertTriangle className='h-3 w-3' />
          Overdue
        </Badge>
      );
    return (
      <Badge variant='secondary' className={cn('gap-1.5', className)}>
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
    subValue
  }: {
    title: string;
    value: React.ReactNode;
    icon: React.ElementType<LucideProps>;
    subValue?: string;
  }) => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='text-muted-foreground h-4 w-4' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-muted-foreground text-xs'>{subValue}</p>
      </CardContent>
    </Card>
  )
);
MetricCard.displayName = 'MetricCard';
const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className='bg-popover min-w-[200px] rounded-lg border p-2 shadow-sm'>
      <div className='space-y-1'>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <div
                className='h-2 w-2 flex-shrink-0 rounded-full'
                style={{ backgroundColor: entry.payload.color }}
              />
              <span className='text-sm'>{entry.name}</span>
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
    const getStatusStyles = () => {
      switch (payment.status) {
        case 'settled':
          return {
            icon: CheckCircle,
            bgColor: 'bg-positive',
            textColor: 'text-positive',
            borderColor: 'border-positive'
          };
        case 'due':
          return {
            icon: AlertTriangle,
            bgColor: 'bg-destructive',
            textColor: 'text-destructive',
            borderColor: 'border-destructive'
          };
        case 'upcoming':
        default:
          return {
            icon: Clock,
            bgColor: 'bg-muted-foreground',
            textColor: 'text-muted-foreground',
            borderColor: 'border-border'
          };
      }
    };
    const { icon: Icon, bgColor, textColor, borderColor } = getStatusStyles();
    return (
      <div
        className='group relative flex cursor-pointer flex-col items-center pt-1'
        onClick={() => onSelect(index)}
      >
        <div
          className={cn('bg-border absolute top-5 left-1/2 z-0 h-0.5 w-full', isLast && 'hidden')}
        >
          <div className={cn('h-full', isSettled ? 'bg-positive' : 'bg-border')} />
        </div>
        <div
          className={cn(
            'bg-background relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
            isSelected
              ? `scale-110 shadow-lg ${borderColor}`
              : `${borderColor} group-hover:scale-105`
          )}
        >
          <Icon className={cn('h-4 w-4', textColor)} />
        </div>
        <p
          className={cn(
            'mt-2 text-center text-[10px] font-medium whitespace-nowrap transition-colors',
            isSelected ? textColor : 'text-muted-foreground group-hover:text-foreground'
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
    <div className='flex-shrink-0 border-b p-4 sm:p-6'>
      <div className='flex items-start justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-32' />
        </div>
        <Skeleton className='h-8 w-8 rounded-md' />
      </div>
      <div className='mt-4 space-y-2'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-2 w-2/3' />
      </div>
    </div>
    <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
      <Skeleton className='mb-4 h-10 w-48' />
      <div className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Skeleton className='h-24' />
          <Skeleton className='h-24' />
          <Skeleton className='h-24' />
          <Skeleton className='h-24' />
        </div>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='space-y-4 lg:col-span-1'>
            <Skeleton className='h-64' />
          </div>
          <div className='space-y-4 lg:col-span-2'>
            <Skeleton className='h-64' />
          </div>
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
    const calculatedTotalInterest =
      paymentSchedule?.reduce((sum, p) => sum + p.interestForPeriod, 0) || 0;
    const totalPayable = totalPrincipal + calculatedTotalInterest;
    const breakdownData = {
      principalPaid:
        paymentSchedule?.[selectedIndex]?.cumulativePrincipalPaid ??
        (debt.debts.isPaid ? totalPrincipal : 0),
      interestPaid:
        paymentSchedule?.[selectedIndex]?.cumulativeInterestPaid ??
        (debt.debts.isPaid ? calculatedTotalInterest : 0),
      remainingPrincipal:
        paymentSchedule?.[selectedIndex]?.remainingPrincipal ??
        (debt.debts.isPaid ? 0 : totalPrincipal)
    };
    const chartData = [
      { name: 'Principal', value: breakdownData.principalPaid, color: 'var(--chart-1)' },
      { name: 'Interest', value: breakdownData.interestPaid, color: 'var(--chart-2)' },
      { name: 'Remaining', value: breakdownData.remainingPrincipal, color: 'var(--chart-3)' }
    ].filter((item) => item.value > 0);
    const settledPayments = paymentSchedule?.filter((p) => p.status === 'settled').length || 0;
    const totalPayments = paymentSchedule?.length || 0;
    const progressPercentage = totalPayments > 0 ? (settledPayments / totalPayments) * 100 : 0;
    return {
      chartData,
      totalInterest: calculatedTotalInterest,
      totalPayable,
      progressStats: {
        settled: settledPayments,
        total: totalPayments,
        percentage: progressPercentage
      }
    };
  }, [selectedIndex, paymentSchedule, debt.debts]);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className='max-h-[95dvh] w-[95vw] max-w-6xl gap-0 overflow-scroll p-0'
      >
        {isLoading ? (
          <ModalSkeleton />
        ) : (
          <div className='flex h-full flex-col'>
            <div className='flex-shrink-0 border-b p-4 sm:px-6 sm:py-4'>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0 flex-1 space-y-2'>
                  <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                    <DialogTitle className='truncate text-lg font-bold sm:text-xl'>
                      {debt.debts.description}
                    </DialogTitle>
                    <div className='flex items-center gap-2'>
                      <StatusBadge isPaid={!!debt.debts.isPaid} isOverdue={!!isOverdue} />
                      <Badge variant='outline' className='capitalize'>
                        {debt.debts.type}
                      </Badge>
                    </div>
                  </div>
                  {data.progressStats.total > 0 && (
                    <div className='space-y-1'>
                      <div className='text-muted-foreground flex justify-between text-xs'>
                        <span>
                          {data.progressStats.settled} of {data.progressStats.total} payments
                        </span>
                        <span>{Math.round(data.progressStats.percentage)}%</span>
                      </div>
                      <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                        <div
                          className='bg-primary h-full rounded-full transition-all'
                          style={{ width: `${data.progressStats.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogClose asChild>
                  <Button variant='ghost' size='icon' className='-mt-1 h-8 w-8 flex-shrink-0'>
                    <X className='h-4 w-4' />
                  </Button>
                </DialogClose>
              </div>
            </div>
            <div className='flex-1 overflow-hidden'>
              <Tabs defaultValue='timeline' className='flex h-full flex-col'>
                <div className='flex-shrink-0 px-4 pt-4 sm:px-6'>
                  <TabsList className='grid w-full grid-cols-2 sm:w-auto'>
                    <TabsTrigger value='timeline'>
                      <Calendar className='mr-2 h-4 w-4' />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value='details'>
                      <FileText className='mr-2 h-4 w-4' />
                      Details
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value='timeline' className='mt-0 flex-1 overflow-y-auto p-4 sm:p-6'>
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                      <MetricCard
                        title='Principal Amount'
                        value={formatCurrency(debt.debts.amount || 0)}
                        icon={IndianRupee}
                        subValue='Original loan amount'
                      />
                      <MetricCard
                        title='Interest Rate'
                        value={`${debt.debts.interestRate}%`}
                        subValue={`${debt.debts.interestType} interest`}
                        icon={Percent}
                      />
                      <MetricCard
                        title='Total Interest'
                        value={formatCurrency(data.totalInterest)}
                        icon={TrendingUp}
                        subValue='Over the loan term'
                      />
                      <MetricCard
                        title='Total Payable'
                        value={formatCurrency(data.totalPayable)}
                        icon={IndianRupee}
                        subValue='Principal + Interest'
                      />
                    </div>
                    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                      {isError || !paymentSchedule ? (
                        <div className='lg:col-span-3'>
                          <NoData
                            message={`Unable to generate payment schedule. ${error?.message || ''}`}
                            icon='x-circle'
                          />
                        </div>
                      ) : paymentSchedule.length > 0 ? (
                        <>
                          <Card className='lg:col-span-1'>
                            <CardHeader>
                              <CardTitle className='text-base'>Payment Breakdown</CardTitle>
                              <CardDescription className='text-sm'>
                                For installment #{selectedIndex + 1}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                      paddingAngle={2}
                                    >
                                      {data.chartData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                      ))}
                                    </Pie>
                                  </RechartsPieChart>
                                </ResponsiveContainer>
                                <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
                                  <span className='text-xl font-bold'>
                                    {formatCurrency(
                                      paymentSchedule[selectedIndex].installmentAmount
                                    )}
                                  </span>
                                  <span className='text-muted-foreground text-xs'>Installment</span>
                                </div>
                              </div>
                              <div className='mt-4 space-y-2'>
                                {data.chartData.map((item) => (
                                  <div
                                    key={item.name}
                                    className='flex items-center justify-between text-sm'
                                  >
                                    <div className='flex items-center gap-2'>
                                      <div
                                        className='h-2 w-2 rounded-full'
                                        style={{ backgroundColor: item.color }}
                                      />
                                      <span className='text-muted-foreground'>{item.name}</span>
                                    </div>
                                    <span className='font-semibold'>
                                      {formatCurrency(item.value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          <Card className='lg:col-span-2'>
                            <CardHeader>
                              <CardTitle className='text-base'>Payment Timeline</CardTitle>
                              <CardDescription className='text-sm'>
                                Scroll to see all installments
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className='scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground -mx-4 flex gap-4 overflow-x-auto px-4 pb-4'>
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
                              {paymentSchedule[selectedIndex] && (
                                <div className='bg-background mt-2 rounded-lg border p-3'>
                                  <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3'>
                                    <div className='space-y-1'>
                                      <p className='text-muted-foreground'>Amount</p>
                                      <p className='font-semibold'>
                                        {formatCurrency(
                                          paymentSchedule[selectedIndex].installmentAmount
                                        )}
                                      </p>
                                    </div>
                                    <div className='space-y-1'>
                                      <p className='text-muted-foreground'>Principal</p>
                                      <p className='font-semibold'>
                                        {formatCurrency(
                                          paymentSchedule[selectedIndex].principalForPeriod
                                        )}
                                      </p>
                                    </div>
                                    <div className='space-y-1'>
                                      <p className='text-muted-foreground'>Interest</p>
                                      <p className='font-semibold'>
                                        {formatCurrency(
                                          paymentSchedule[selectedIndex].interestForPeriod
                                        )}
                                      </p>
                                    </div>
                                    <div className='space-y-1'>
                                      <p className='text-muted-foreground'>Date</p>
                                      <p className='font-semibold'>
                                        {format(paymentSchedule[selectedIndex].date, 'PP')}
                                      </p>
                                    </div>
                                    <div className='space-y-1'>
                                      <p className='text-muted-foreground'>Balance</p>
                                      <p className='font-semibold'>
                                        {formatCurrency(
                                          paymentSchedule[selectedIndex].remainingPrincipal
                                        )}
                                      </p>
                                    </div>
                                    <div className='space-y-1'>
                                      <p className='text-muted-foreground'>Status</p>
                                      <p
                                        className={cn(
                                          'font-semibold capitalize',
                                          paymentSchedule[selectedIndex].status === 'settled'
                                            ? 'text-positive'
                                            : paymentSchedule[selectedIndex].status === 'due'
                                              ? 'text-destructive'
                                              : 'text-muted-foreground'
                                        )}
                                      >
                                        {paymentSchedule[selectedIndex].status}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <div className='lg:col-span-3'>
                          <NoData message='No payment schedule available for this debt.' />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value='details' className='mt-0 flex-1 overflow-y-auto p-4 sm:p-6'>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-base'>Counterparty Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='flex items-center gap-4'>
                          <Avatar className='h-12 w-12'>
                            <AvatarImage src={debt.user?.image || undefined} />
                            <AvatarFallback>
                              <User />
                            </AvatarFallback>
                          </Avatar>
                          <div className='min-w-0'>
                            <p className='truncate font-semibold'>
                              {debt.user?.name || 'Unknown User'}
                            </p>
                            <p className='text-muted-foreground truncate text-sm'>
                              {debt.user?.email || 'No email provided'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-base'>Associated Account</CardTitle>
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
                    <Card className='md:col-span-2'>
                      <CardHeader>
                        <CardTitle className='text-base'>Loan Terms & Conditions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4'>
                          <div className='space-y-1'>
                            <p className='text-muted-foreground text-sm'>Start Date</p>
                            <p className='font-semibold'>
                              {format(new Date(debt.debts.startDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-muted-foreground text-sm'>Final Due Date</p>
                            <p className='font-semibold'>
                              {finalDueDate ? format(finalDueDate, 'MMM d, yyyy') : 'N/A'}
                            </p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-muted-foreground text-sm'>Payment Frequency</p>
                            <p className='font-semibold capitalize'>
                              {debt.debts.paymentFrequency}
                            </p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-muted-foreground text-sm'>Loan Term</p>
                            <p className='font-semibold capitalize'>
                              {debt.debts.termLength} {debt.debts.termUnit}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
