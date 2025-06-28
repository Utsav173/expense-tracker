'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { DebtWithDetails, Debts, Payment } from '@/lib/types';
import { interestCalculate } from '@/lib/endpoints/debt';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, X, TrendingUp, Clock, DollarSign, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  format,
  parseISO,
  isAfter,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  differenceInDays
} from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import NoData from '../ui/no-data';
import { TimelineScroller } from '../debt/timeline-scroller';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface DebtInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debt: DebtWithDetails;
}

const COLORS = {
  'Principal Paid': 'var(--primary)',
  'Interest Paid': 'var(--destructive)',
  'Premium/Fees': 'var(--warning)',
  'Remaining Principal': 'var(--muted)'
};

const generatePaymentSchedule = (debt: Debts, totalInterest: number = 0): Payment[] => {
  if (!debt.createdAt || !debt.dueDate || !debt.frequency || !debt.duration) return [];

  const startDate = parseISO(debt.createdAt);
  const endDate = parseISO(debt.dueDate);
  const totalPrincipal = debt.amount || 0;
  const numInstallments = parseInt(debt.frequency, 10);
  const today = new Date();

  if (isNaN(numInstallments) || numInstallments <= 0) return [];

  const interestPerInstallment = totalInterest > 0 ? totalInterest / numInstallments : 0;
  const principalPerInstallment = totalPrincipal / numInstallments;
  const installmentAmount = principalPerInstallment + interestPerInstallment;

  const schedule: Payment[] = [];
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  for (let i = 1; i <= numInstallments; i++) {
    let installmentDate: Date;
    switch (debt.duration) {
      case 'daily':
        installmentDate = addDays(startDate, i);
        break;
      case 'weekly':
        installmentDate = addWeeks(startDate, i);
        break;
      case 'monthly':
        installmentDate = addMonths(startDate, i);
        break;
      case 'yearly':
        installmentDate = addYears(startDate, i);
        break;
      default:
        const totalDays = differenceInDays(endDate, startDate);
        installmentDate = addDays(startDate, Math.round((totalDays / numInstallments) * i));
        break;
    }

    if (isAfter(installmentDate, addDays(endDate, 1))) break;

    let status: Payment['status'];
    if (debt.isPaid) {
      status = 'settled';
    } else if (isAfter(today, installmentDate)) {
      status = 'due';
    } else {
      status = 'upcoming';
    }

    cumulativePrincipal += principalPerInstallment;
    cumulativeInterest += interestPerInstallment;

    schedule.push({
      date: installmentDate,
      status: status,
      installmentAmount: installmentAmount,
      principalForPeriod: principalPerInstallment,
      interestForPeriod: interestPerInstallment,
      cumulativePrincipalPaid: cumulativePrincipal,
      cumulativeInterestPaid: cumulativeInterest,
      remainingPrincipal: totalPrincipal - cumulativePrincipal
    });
  }
  return schedule;
};

const DebtInsightModal: React.FC<DebtInsightModalProps> = ({ isOpen, onOpenChange, debt }) => {
  const {
    data: interestData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['debtInterestCalculation', debt.debts.id],
    queryFn: () => {
      const { amount, percentage, interestType, createdAt, dueDate } = debt.debts;
      if (!dueDate || !createdAt) {
        return Promise.reject(
          new Error('Cannot calculate interest without creation and due dates.')
        );
      }
      return interestCalculate({
        amount,
        percentage,
        type: interestType,
        duration: `${format(parseISO(createdAt), 'yyyy-MM-dd')},${format(
          parseISO(dueDate),
          'yyyy-MM-dd'
        )}`
      });
    },
    enabled: isOpen && !!debt.debts.dueDate && !!debt.debts.createdAt,
    staleTime: Infinity,
    retry: false
  });

  const paymentSchedule = useMemo(
    () => generatePaymentSchedule(debt.debts, interestData?.interest),
    [debt.debts, interestData]
  );

  const getDefaultIndex = useCallback(() => {
    if (debt.debts.isPaid) return Math.max(0, paymentSchedule.length - 1);
    const firstUpcoming = paymentSchedule.findIndex((p) => p.status === 'upcoming');
    return firstUpcoming !== -1 ? firstUpcoming : Math.max(0, paymentSchedule.length - 1);
  }, [debt.debts.isPaid, paymentSchedule]);

  const [selectedIndex, setSelectedIndex] = useState<number>(getDefaultIndex());

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(getDefaultIndex());
    }
  }, [isOpen, getDefaultIndex]);

  const breakdownData = useMemo(() => {
    const selectedInstallmentData = paymentSchedule[selectedIndex] || null;
    const totalPrincipal = debt.debts.amount || 0;
    const totalPremium = debt.debts.premiumAmount || 0;
    const totalInterest = interestData?.interest || 0;
    const totalPayable = totalPrincipal + totalInterest + totalPremium;

    if (!selectedInstallmentData) {
      return {
        principalPaid: debt.debts.isPaid ? totalPrincipal : 0,
        interestPaid: debt.debts.isPaid ? totalInterest : 0,
        premiumPaid: debt.debts.isPaid ? totalPremium : 0,
        remainingPrincipal: debt.debts.isPaid ? 0 : totalPrincipal,
        totalPayable,
        statusAsOfDate: debt.debts.dueDate ? parseISO(debt.debts.dueDate) : new Date()
      };
    }
    return {
      principalPaid: selectedInstallmentData.cumulativePrincipalPaid,
      interestPaid: selectedInstallmentData.cumulativeInterestPaid,
      premiumPaid: (totalPremium / paymentSchedule.length) * (selectedIndex + 1),
      remainingPrincipal: selectedInstallmentData.remainingPrincipal,
      totalPayable,
      statusAsOfDate: selectedInstallmentData.date
    };
  }, [selectedIndex, paymentSchedule, debt.debts, interestData]);

  const chartData = useMemo(() => {
    const data = [
      { name: 'Principal Paid', value: breakdownData.principalPaid },
      { name: 'Interest Paid', value: breakdownData.interestPaid },
      { name: 'Premium/Fees', value: breakdownData.premiumPaid },
      { name: 'Remaining Principal', value: breakdownData.remainingPrincipal }
    ];
    return data.filter((item) => item.value > 0);
  }, [breakdownData]);

  const isOverdue =
    !debt.debts.isPaid && debt.debts.dueDate && isAfter(new Date(), parseISO(debt.debts.dueDate));

  const debtStatus = debt.debts.isPaid ? 'paid' : isOverdue ? 'overdue' : 'active';

  const getStatusConfig = () => {
    switch (debtStatus) {
      case 'paid':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badge: { variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700' }
        };
      case 'overdue':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badge: { variant: 'destructive' as const, className: '' }
        };
      default:
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badge: { variant: 'outline' as const, className: 'border-blue-200' }
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Key metrics for quick overview
  const keyMetrics = [
    {
      label: 'Principal Amount',
      value: formatCurrency(debt.debts.amount || 0),
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      label: 'Interest Rate',
      value: `${debt.debts.percentage}%`,
      subValue: debt.debts.interestType,
      icon: TrendingUp,
      color: 'text-orange-600'
    },
    {
      label: 'Total Interest',
      value: formatCurrency(interestData?.interest || 0),
      icon: TrendingUp,
      color: 'text-red-600',
      loading: isLoading
    },
    {
      label: 'Final Amount',
      value: formatCurrency(breakdownData.totalPayable),
      icon: DollarSign,
      color: 'text-green-600',
      loading: isLoading
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent hideClose className='max-h-[95dvh] w-[98vw] max-w-7xl overflow-y-auto p-0'>
        <DialogHeader className='bg-muted/30 border-b px-6 py-4'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <DialogTitle className='text-xl'>Debt Analysis</DialogTitle>
                <Badge {...statusConfig.badge}>
                  {debt.debts.isPaid ? 'Settled' : isOverdue ? 'Overdue' : 'Active'}
                </Badge>
              </div>
              <DialogDescription className='text-base'>
                {debt.debts.description || 'Debt tracking and payment analysis'}
              </DialogDescription>
            </div>
            <div
              className={cn(
                'mr-4 flex items-center gap-2 rounded-lg border p-3 max-sm:mt-6 max-sm:mr-0 max-sm:p-1',
                statusConfig.bgColor,
                statusConfig.borderColor
              )}
            >
              <StatusIcon className={cn('h-5 w-5 max-sm:h-3 max-sm:w-3', statusConfig.color)} />
              <div className='text-sm font-medium'>
                {debt.debts.type === 'given' ? 'Money Lent' : 'Money Borrowed'}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto'>
          {/* Key Metrics Bar */}
          <div className='bg-background border-b p-4'>
            <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
              {keyMetrics.map((metric, index) => {
                const MetricIcon = metric.icon;
                return (
                  <div key={index} className='flex items-center gap-3 rounded-lg border p-3'>
                    <div className={cn('bg-muted rounded-full p-2', metric.color)}>
                      <MetricIcon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='text-muted-foreground text-xs'>{metric.label}</div>
                      {metric.loading ? (
                        <Skeleton className='h-5 w-16' />
                      ) : (
                        <div className='font-semibold'>{metric.value}</div>
                      )}
                      {metric.subValue && (
                        <div className='text-muted-foreground text-xs'>{metric.subValue}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='p-6'>
            <Tabs defaultValue='timeline' className='space-y-6'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='timeline' className='max-sm:text-xs'>
                  Payment Timeline
                </TabsTrigger>
                <TabsTrigger value='breakdown' className='max-sm:text-xs'>
                  Financial Breakdown
                </TabsTrigger>
                <TabsTrigger value='details' className='max-sm:text-xs'>
                  Debt Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value='timeline' className='space-y-4'>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Schedule</CardTitle>
                    <CardDescription>
                      Interactive timeline showing all payment installments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paymentSchedule.length > 0 ? (
                      <TimelineScroller
                        schedule={paymentSchedule}
                        selectedIndex={selectedIndex}
                        onSelect={setSelectedIndex}
                      />
                    ) : (
                      <NoData message='Payment schedule cannot be generated with the available information.' />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='breakdown' className='space-y-4'>
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Composition</CardTitle>
                      <CardDescription>
                        Financial breakdown as of{' '}
                        {format(breakdownData.statusAsOfDate, 'MMMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className='h-[200px] w-full' />
                      ) : isError || !interestData ? (
                        <Alert>
                          <AlertTriangle className='h-4 w-4' />
                          <AlertDescription>
                            Unable to calculate financial breakdown. {error?.message}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className='space-y-4'>
                          <div className='relative h-[200px]'>
                            <ResponsiveContainer width='100%' height='100%'>
                              <PieChart>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'var(--background)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px'
                                  }}
                                  formatter={(value: number) => formatCurrency(value)}
                                />
                                <Pie
                                  data={chartData}
                                  dataKey='value'
                                  nameKey='name'
                                  cx='50%'
                                  cy='50%'
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={4}
                                  stroke='var(--background)'
                                  strokeWidth={2}
                                >
                                  {chartData.map((entry) => (
                                    <Cell
                                      key={entry.name}
                                      fill={COLORS[entry.name as keyof typeof COLORS]}
                                    />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className='absolute inset-0 flex flex-col items-center justify-center text-center'>
                              <span className='text-muted-foreground text-xs'>
                                {debt.debts.type === 'taken' ? 'Total Payable' : 'Total Receivable'}
                              </span>
                              <span className='text-lg font-bold'>
                                {formatCurrency(breakdownData.totalPayable)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Amount Breakdown</CardTitle>
                      <CardDescription>Detailed financial components</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-4'>
                        {[
                          {
                            label: 'Principal Paid',
                            value: breakdownData.principalPaid,
                            color: 'bg-primary'
                          },
                          {
                            label: 'Interest Paid',
                            value: breakdownData.interestPaid,
                            color: 'bg-destructive'
                          },
                          {
                            label: 'Premium/Fees',
                            value: breakdownData.premiumPaid,
                            color: 'bg-warning'
                          },
                          {
                            label: 'Remaining Principal',
                            value: breakdownData.remainingPrincipal,
                            color: 'bg-muted'
                          }
                        ].map((item, index) => (
                          <div key={index} className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className={cn('h-3 w-3 rounded-full', item.color)} />
                              <span className='text-muted-foreground text-sm'>{item.label}</span>
                            </div>
                            <span className='font-medium'>{formatCurrency(item.value)}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className='flex items-center justify-between font-bold'>
                          <span>Total Amount</span>
                          <span>{formatCurrency(breakdownData.totalPayable)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value='details' className='space-y-4'>
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Counterparty Information</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex items-center gap-4'>
                        <Avatar className='h-12 w-12'>
                          <AvatarImage src={debt.user?.profilePic || undefined} />
                          <AvatarFallback>
                            <User className='h-6 w-6' />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-semibold'>{debt.user?.name || 'Unknown'}</div>
                          <div className='text-muted-foreground text-sm'>
                            {debt.user?.email || 'No email provided'}
                          </div>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-y-3 text-sm'>
                        <div className='text-muted-foreground'>Account:</div>
                        <div className='font-medium'>{debt.account?.name || 'Not specified'}</div>

                        <div className='text-muted-foreground'>Transaction Type:</div>
                        <div>
                          <Badge variant={debt.debts.type === 'given' ? 'outline' : 'default'}>
                            {debt.debts.type === 'given' ? 'Money Lent' : 'Money Borrowed'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Terms & Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='space-y-3 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Created:</span>
                          <span className='font-medium'>
                            {debt.debts.createdAt
                              ? format(parseISO(debt.debts.createdAt), 'MMM d, yyyy')
                              : 'Unknown'}
                          </span>
                        </div>

                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Due Date:</span>
                          <span className='font-medium'>
                            {debt.debts.dueDate
                              ? format(parseISO(debt.debts.dueDate), 'MMM d, yyyy')
                              : 'Not set'}
                          </span>
                        </div>

                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Payment Frequency:</span>
                          <span className='font-medium'>{debt.debts.frequency} installments</span>
                        </div>

                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Duration:</span>
                          <span className='font-medium capitalize'>{debt.debts.duration}</span>
                        </div>

                        {debt.debts.premiumAmount && debt.debts.premiumAmount > 0 && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Premium/Fees:</span>
                            <span className='font-medium'>
                              {formatCurrency(debt.debts.premiumAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogClose asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute top-4 right-4 h-8 w-8'
          >
            <X className='h-4 w-4' />
            <span className='sr-only'>Close</span>
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default DebtInsightModal;
