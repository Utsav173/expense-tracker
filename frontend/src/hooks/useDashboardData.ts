'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { accountGetDashboard } from '@/lib/endpoints/accounts';
import { goalGetAll } from '@/lib/endpoints/goal';

import { DashboardData, SavingGoal, User } from '@/lib/types';

interface UseDashboardDataOptions {
  timeRangeOption: string;
  customDateRange?: DateRange;
  user?: User | null;
}

interface CombinedDashboardData {
  dashboardSummary: DashboardData | null;
  goals: SavingGoal[] | null;
}

export const useDashboardData = ({
  user
}: UseDashboardDataOptions): {
  data: CombinedDashboardData | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} => {
  const queryClient = useQueryClient();

  const dashboardSummaryQuery = useQuery({
    queryKey: ['dashboardData'],
    queryFn: () => accountGetDashboard(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const goalsQuery = useQuery({
    queryKey: ['goalsDashboard'],
    queryFn: () => goalGetAll({ page: 1, limit: 5 }),
    enabled: !!user,
    staleTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const isLoading = dashboardSummaryQuery.isLoading || goalsQuery.isLoading;
  const isFetching = dashboardSummaryQuery.isFetching || goalsQuery.isFetching;
  const error = dashboardSummaryQuery.error || goalsQuery.error;

  const combinedData = useMemo((): CombinedDashboardData | null => {
    if (isLoading || !dashboardSummaryQuery.data || !goalsQuery.data) {
      return null;
    }
    return {
      dashboardSummary: dashboardSummaryQuery.data,
      goals: goalsQuery.data?.data ?? []
    };
  }, [isLoading, dashboardSummaryQuery.data, goalsQuery.data]);

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    await queryClient.invalidateQueries({ queryKey: ['goalsDashboard'] });
  }, [queryClient]);

  return {
    data: combinedData,
    isLoading,
    isFetching,
    isError: !!error,
    error: error as Error | null,
    refetch
  };
};
