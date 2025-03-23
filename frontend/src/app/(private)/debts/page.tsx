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
import ComingSoon from '@/components/ui/coming-soon';

const DebtsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [type, setType] = useState<string | undefined>(undefined);
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

  useEffect(() => {
    handlePageChange(1);
  }, [debouncedSearch, type]);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Debts Details : ${(error as Error).message}`);
    return null;
  }

  return <ComingSoon featureName='Debts Comings Soon' />;

  // return (
  //   <div className='container space-y-6'>
  //     <div className='flex items-center justify-between'>
  //       <h1 className='text-3xl font-semibold'>Debts</h1>
  //       <Button onClick={() => setIsAddModalOpen(true)}>
  //         <PlusCircle className='mr-2 h-4 w-4' /> Add Debt
  //       </Button>
  //     </div>

  //     <div className='flex items-center gap-4'>
  //       <Input
  //         type='text'
  //         placeholder='Search debts...'
  //         value={search}
  //         onChange={(e) => setSearch(e.target.value)}
  //         className='max-w-sm'
  //       />

  //       <Select onValueChange={(value) => setType(value)} value={type || 'all'}>
  //         <SelectTrigger className='w-[180px]'>
  //           <SelectValue placeholder='Select Type' />
  //         </SelectTrigger>
  //         <SelectContent>
  //           <SelectItem value='all'>All Types</SelectItem>
  //           <SelectItem value='given'>Given</SelectItem>
  //           <SelectItem value='taken'>Taken</SelectItem>
  //         </SelectContent>
  //       </Select>
  //     </div>
  //     <CommonTable
  //       data={debts?.data || []}
  //       columns={debtColumns}
  //       loading={isLoading}
  //       totalRecords={debts?.totalCount || 0}
  //       pageSize={10}
  //       currentPage={page}
  //       onPageChange={handlePageChange}
  //     />

  //     <AddDebtModal
  //       isOpen={isAddModalOpen}
  //       onOpenChange={setIsAddModalOpen}
  //       onDebtAdded={refetch}
  //     />
  //   </div>
  // );
};

export default DebtsPage;
