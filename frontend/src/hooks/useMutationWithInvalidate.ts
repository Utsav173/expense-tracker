import { useMutation } from '@tanstack/react-query';
import { useInvalidateQueries } from './useInvalidateQueries';

interface MutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: any[];
  onSuccess?: (data: TData) => void;
  onError?: (error: any) => void;
}

export const useMutationWithInvalidate = <TData, TVariables>(
  options: MutationOptions<TData, TVariables>
) => {
  const invalidate = useInvalidateQueries();
  const mutation = useMutation({
    ...options,
    onSuccess: (data) => {
      if (options.queryKey) {
        invalidate(options.queryKey);
      }
      options.onSuccess?.(data);
    },
    onError: (error) => {
      options.onError?.(error);
    }
  });
  return mutation;
};
