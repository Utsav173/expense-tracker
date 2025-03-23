import { InvalidateQueryFilters, useMutation, useQueryClient } from '@tanstack/react-query';

interface MutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: InvalidateQueryFilters['queryKey'];
  onSuccess?: (data: TData) => void;
  onError?: (error: any) => void;
}

export const useMutationWithInvalidate = <TData, TVariables>(
  options: MutationOptions<TData, TVariables>
) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    ...options,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      options.onError?.(error);
    }
  });
  return mutation;
};
