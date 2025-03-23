import { useQueryClient } from '@tanstack/react-query';

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  const invalidate = async (queryKeys: any[]) => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys,
      refetchType: 'all'
    });
  };

  return invalidate;
};
