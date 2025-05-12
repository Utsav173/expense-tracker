'use client';

import { authGetMe, authLogin, authLogOut } from '@/lib/endpoints/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storeAuthToken, storeUser, removeAuthToken } from '@/app/(public)/auth/actions';
import { getAuthTokenClient } from '@/lib/auth';
import { LoginResponse, User, ApiResponse } from '@/lib/types';

type LoginResponseData = ApiResponse<LoginResponse>;

type LoginMutationVariables = { email: string; password: string };

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

  const userQueryResult = useQuery({
    queryKey: ['user'],
    queryFn: authGetMe,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const {
    data: user,
    isLoading: userIsLoading,
    isError: userIsError,
    error: userQueryError,
    refetch
  } = userQueryResult;

  // Define the type for the login mutation result
  const {
    mutateAsync: loginMutateAsync,
    isPending: loginLoading,
    isError: loginIsError,
    error: loginError
  } = useMutation({
    mutationFn: async (param: LoginMutationVariables) => {
      const res = (await authLogin(param)) as LoginResponseData;
      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        await Promise.all([storeAuthToken(res.data.token), storeUser(res.data.user)]);
        queryClient.setQueryData(['user'], res.data.user);
        return res.data.user;
      } else {
        throw new Error(res?.error?.message || 'Failed to login');
      }
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await authLogOut();
      localStorage.removeItem('token');
      await removeAuthToken();
      queryClient.removeQueries({ queryKey: ['user'] });
      return response;
    }
  });

  const { mutate: logout } = logoutMutation;

  const loginAction = async (email: string, password: string): Promise<void> => {
    await loginMutateAsync({ email, password });
  };

  const logoutAction = async () => {
    await logout();
  };

  return {
    user: user ?? undefined,
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
