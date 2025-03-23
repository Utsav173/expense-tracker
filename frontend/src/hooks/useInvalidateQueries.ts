import { useQueryClient } from '@tanstack/react-query';

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  const invalidate = (queryKeys: any[]) => {
    queryClient.invalidateQueries({ queryKey: queryKeys });
  };

  return invalidate;
};
