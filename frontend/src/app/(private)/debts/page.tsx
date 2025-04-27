'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetchDebts } from '@/lib/endpoints/debt';
import { useState, useEffect } from 'react';
import Loader from '@/components/ui/loader';
import CommonTable from '@/components/ui/CommonTable';
import { usePagination } from '@/hooks/usePagination';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { createDebtColumns } from '@/components/debt/debt-columns';
import AddDebtModal from '@/components/modals/add-debt-modal';
import { useAuth } from '@/lib/hooks/useAuth';

type DebtTypeFilter = '' | 'given' | 'taken' | 'all' | undefined;

const DebtsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 600);
  const [type, setType] = useState<DebtTypeFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { page, handlePageChange } = usePagination(
    Number(searchParams.get('page')) || 1,
    (params) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          currentParams.delete(key);
        } else {
          currentParams.set(key.toString(), params[key]);
        }
      });
      const newUrl = `${pathname}?${currentParams.toString()}`;
      router.push(newUrl, { scroll: false });
    }
  );

  const {
    data: debts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['debts', page, debouncedSearch, type],
    queryFn: () =>
      apiFetchDebts({
        page,
        pageSize: 10,
        q: debouncedSearch,
        type: type === 'all' ? '' : type
      }),
    retry: false
  });

  const debtColumns = createDebtColumns({ user, refetchDebts: refetch });

  useEffect(() => {
    handlePageChange(1);
  }, [debouncedSearch, type]);

  if (isLoading || !user) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Debts Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-row justify-between gap-3 max-sm:flex-col max-sm:justify-center'>
        <h1 className='text-2xl font-semibold md:text-3xl'>Debts</h1>
        <Button onClick={() => setIsAddModalOpen(true)} size='sm'>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Debt
        </Button>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
        <Input
          type='text'
          placeholder='Search description, due date, amount...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-full grow sm:max-w-xs'
        />

        <div className='w-full sm:w-[180px]'>
          <Select onValueChange={(value) => setType(value as DebtTypeFilter)} value={type || 'all'}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='given'>Given</SelectItem>
              <SelectItem value='taken'>Taken</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='w-full'>
        <CommonTable
          data={debts?.data || []}
          columns={debtColumns}
          loading={isLoading}
          totalRecords={debts?.totalCount || 0}
          pageSize={10}
          currentPage={page}
          onPageChange={handlePageChange}
          enablePagination
        />
      </div>

      <AddDebtModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onDebtAdded={refetch}
        hideTriggerButton
      />
    </div>
  );
};

export default DebtsPage;
