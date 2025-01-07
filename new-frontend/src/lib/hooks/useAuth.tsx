'use client';

import { authGetMe, authLogin, authLogOut } from '@/lib/endpoints/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storeAuthToken, storeUser, removeAuthToken } from '@/app/auth/actions';
import { getAuthTokenClient } from '@/lib/auth';
import { LoginResponse, User, ApiResponse } from '@/lib/types';

type LoginResponseData = ApiResponse<LoginResponse>;
type UserApiResponse = ApiResponse<User>;

export const useAuth = () => {
  const token = getAuthTokenClient();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: userIsLoading,
    isError: userIsError
  } = useQuery<UserApiResponse>({
    queryKey: ['user'],
    queryFn: () => authGetMe() as Promise<User | null>,
    enabled: !!token,
    retry: false
  });

  const loginMutation = useMutation<User, Error, { email: string; password: string }>({
    mutationFn: async (param) => {
      const res = (await authLogin(param)) as LoginResponseData;

      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        await storeAuthToken(res.data.token);
        await storeUser(res.data.user);
        queryClient.invalidateQueries({ queryKey: ['user'] });
        return res.data.user;
      } else {
        throw new Error('Failed to login');
      }
    }
  });

  const { mutate: login, isLoading: loginLoading, isError: loginIsError } = loginMutation as any;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await authLogOut();
      localStorage.removeItem('token');
      await removeAuthToken();
      queryClient.removeQueries({ queryKey: ['user'] });
      return response;
    }
  });

  const {
    mutate: logout,
    isLoading: logoutLoading,
    isError: logoutIsError
  } = logoutMutation as any;

  const loginAction = async (email: string, password: string) => {
    await login({ email, password });
  };

  const logoutAction = async () => {
    await logout();
  };

  return {
    user,
    login: loginAction,
    logoutAction,
    loginIsError,
    loginLoading,
    logoutIsError,
    logoutLoading,
    userIsLoading,
    userIsError
  };
};
