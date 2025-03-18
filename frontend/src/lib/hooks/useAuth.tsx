'use client';

import { authGetMe, authLogin, authLogOut } from '@/lib/endpoints/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storeAuthToken, storeUser, removeAuthToken } from '@/app/(public)/auth/actions';
import { getAuthTokenClient } from '@/lib/auth';
import { LoginResponse, User, ApiResponse } from '@/lib/types';

type LoginResponseData = ApiResponse<LoginResponse>;

export const useAuth = () => {
  const token = getAuthTokenClient();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userQueryError,
    refetch
  } = useQuery({
    queryKey: ['user'],
    queryFn: authGetMe,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const loginMutation = useMutation<User, Error, { email: string; password: string }>({
    mutationFn: async (param) => {
      const res = (await authLogin(param)) as LoginResponseData;
      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        await Promise.all([storeAuthToken(res.data.token), storeUser(res.data.user)]);
        // Instead of invalidating, directly set the query data
        queryClient.setQueryData(['user'], res.data.user);
        return res.data.user;
      } else {
        throw new Error('Failed to login');
      }
    }
  });

  const {
    mutate: login,
    isLoading: loginLoading,
    isError: loginIsError,
    error: loginError
  } = loginMutation as any;

  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      const response = await authLogOut();
      localStorage.removeItem('token');
      await removeAuthToken();
      queryClient.removeQueries({ queryKey: ['user'] });
      return response;
    }
  });

  const loginAction = async (email: string, password: string) => {
    await login({ email, password });
  };

  const logoutAction = async () => {
    await logout();
  };

  return {
    user,
    login: loginAction,
    logoutAction: logoutAction,
    loginIsError,
    loginLoading,
    userIsLoading,
    userIsError,
    loginError,
    userQueryError,
    refetchUser: refetch
  };
};
