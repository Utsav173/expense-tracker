'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authGetMe, authLogin, authLogOut } from '@/lib/endpoints/auth';
import { storeAuthToken, storeUser, removeAuthToken } from '@/app/(public)/auth/actions';
import { getAuthTokenClient } from '@/lib/auth';
import { ApiResponse, LoginResponse, User } from '@/lib/types';

type LoginVariables = {
  email: string;
  password: string;
};

type UseAuthReturn = {
  user: User | undefined;
  login: (email: string, password: string) => Promise<void>;
  logoutAction: () => Promise<void>;
  loginLoading: boolean;
  loginIsError: boolean;
  loginError: Error | null;
  userIsLoading: boolean;
  userIsError: boolean;
  userQueryError: Error | null;
  refetchUser: () => void;
};

export const useAuth = (): UseAuthReturn => {
  const token = getAuthTokenClient();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userQueryError,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => authGetMe(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  const {
    mutateAsync: login,
    isPending: loginLoading,
    isError: loginIsError,
    error: loginError
  } = useMutation({
    mutationFn: async (credentials: LoginVariables) => {
      const res = (await authLogin(credentials)) as ApiResponse<LoginResponse>;
      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token || !user) {
        throw new Error(res?.error?.message || 'Failed to login');
      }

      localStorage.setItem('token', token);
      await Promise.all([storeAuthToken(token), storeUser(user)]);

      queryClient.setQueryData(['user'], user);
      return user;
    }
  });

  const { mutateAsync: logoutAction } = useMutation({
    mutationFn: async () => {
      await authLogOut();
      localStorage.removeItem('token');
      await removeAuthToken();
      queryClient.removeQueries({ queryKey: ['user'] });
    }
  });

  const loginAction = async (email: string, password: string): Promise<void> => {
    await login({ email, password });
  };

  return {
    user: user ?? undefined,
    login: loginAction,
    logoutAction,
    loginLoading,
    loginIsError,
    loginError: loginError ?? null,
    userIsLoading,
    userIsError,
    userQueryError: userQueryError ?? null,
    refetchUser
  };
};
