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
import { debtColumns } from '@/components/debt/debt-columns';
import AddDebtModal from '@/components/modals/add-debt-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { DebtWithDetails } from '@/lib/types';

type DebtTypeFilter = '' | 'given' | 'taken' | 'all' | undefined;

const DebtsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

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
    data: debtsData,
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
        type: type === 'all' ? undefined : type
      }),
    retry: false
  });

  useEffect(() => {
    handlePageChange(1);
  }, [debouncedSearch, type]);

  const handleDebtAdded = () => {
    invalidate(['debts']); // Invalidate base query key
    refetch();
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Debts Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='container space-y-6 p-4 md:p-6 lg:p-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-semibold'>Debts</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Debt
        </Button>
      </div>

      <div className='flex flex-col gap-4 sm:flex-row'>
        <Input
          type='text'
          placeholder='Search debts by description...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm'
        />

        <Select onValueChange={(value) => setType(value as DebtTypeFilter)} value={type || 'all'}>
          <SelectTrigger className='w-full sm:w-[180px]'>
            <SelectValue placeholder='Select Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='given'>Given (Loaned Out)</SelectItem>
            <SelectItem value='taken'>Taken (Borrowed)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CommonTable<DebtWithDetails> // Specify the correct type here
        data={debtsData?.data || []}
        columns={debtColumns}
        loading={isLoading}
        totalRecords={debtsData?.totalCount || 0}
        pageSize={10}
        currentPage={page}
        onPageChange={handlePageChange}
        enablePagination
      />

      <AddDebtModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onDebtAdded={handleDebtAdded}
        hideTriggerButton
      />
    </div>
  );
};

export default DebtsPage;
