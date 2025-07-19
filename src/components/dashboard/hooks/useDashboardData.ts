'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { accountGetDashboard } from '@/lib/endpoints/accounts';
import { ApiResponse, DashboardData } from '@/lib/types';

export const useDashboardData = (): {
  data: ApiResponse<DashboardData> | undefined;
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
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const isLoading = dashboardSummaryQuery.isLoading;
  const isFetching = dashboardSummaryQuery.isFetching;
  const error = dashboardSummaryQuery.error;

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    await queryClient.invalidateQueries({ queryKey: ['goalsDashboard'] });
  }, [queryClient]);

  return {
    data: dashboardSummaryQuery.data,
    isLoading,
    isFetching,
    isError: !!error,
    error: error as Error | null,
    refetch
  };
};
