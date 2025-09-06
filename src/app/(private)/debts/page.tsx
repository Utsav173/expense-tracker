'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetchDebts } from '@/lib/endpoints/debt';
import { useState } from 'react';
import CommonTable from '@/components/ui/CommonTable';
import { useUrlState } from '@/hooks/useUrlState';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createDebtColumns } from '@/components/debt/debt-columns';
import AddDebtModal from '@/components/modals/add-debt-modal';
import { useAuth } from '@/components/providers/auth-provider';
import InterestCalculatorModal from '@/components/modals/interest-calculator-modal';
import { z } from 'zod';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { Icon } from '@/components/ui/icon';

type InterestFormSchema = z.infer<typeof apiEndpoints.interest.calculate.body>;
type DebtTypeFilter = 'given' | 'taken' | 'all' | undefined;

const initialUrlState = {
  page: 1,
  sortBy: 'startDate',
  sortOrder: 'desc' as 'asc' | 'desc',
  q: '',
  type: 'all' as DebtTypeFilter
};

const DebtsPage = () => {
  const { session } = useAuth();
  const user = session?.user;

  const { state, setState, handlePageChange, searchQuery, setSearchQuery } =
    useUrlState(initialUrlState);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [initialDebtData, setInitialDebtData] = useState<Partial<any> | undefined>();

  const {
    data: debts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['debts', state.page, state.q, state.type, state.sortBy, state.sortOrder],
    queryFn: () =>
      apiFetchDebts({
        page: state.page,
        limit: 10,
        q: state.q,
        type: state.type === 'all' ? undefined : state.type,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      }),
    retry: false
  });

  const handleSortChange = (sorting: any) => {
    if (sorting.length > 0) {
      setState({ sortBy: sorting[0].id, sortOrder: sorting[0].desc ? 'desc' : 'asc', page: 1 });
    } else {
      setState({ sortBy: 'startDate', sortOrder: 'desc', page: 1 });
    }
  };

  const debtColumns = createDebtColumns({ user, refetchDebts: refetch });

  const handleUseCalculation = (data: InterestFormSchema) => {
    setInitialDebtData({
      amount: data.amount,
      interestRate: data.interestRate,
      termLength: data.termLength,
      termUnit: data.termUnit,
      interestType: data.interestType
    });
    setIsCalcModalOpen(false);
    setIsAddModalOpen(true);
  };

  if (error) {
    return <QueryErrorDisplay error={error} message="We couldn't load your debt data." />;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-row justify-between gap-3 max-sm:flex-col max-sm:justify-center'>
        <h1 className='text-2xl font-semibold md:text-3xl'>Debts</h1>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => setIsCalcModalOpen(true)}>
            <Icon name='calculator' className='mr-2 h-4 w-4' /> Calculator
          </Button>
          <Button
            variant='planning'
            className='h-10 px-4 py-2'
            onClick={() => {
              setInitialDebtData(undefined);
              setIsAddModalOpen(true);
            }}
          >
            <Icon name='coins' className='mr-2 h-4 w-4' /> Add Debt
          </Button>
        </div>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
        <div className='relative flex-1'>
          <Icon
            name='search'
            className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
          />
          <Input
            type='text'
            placeholder='Search description, amount, counterparty...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='max-w-full grow pl-9'
          />
        </div>
        <div className='w-full sm:w-[180px]'>
          <Select
            onValueChange={(value) => setState({ type: value as DebtTypeFilter, page: 1 })}
            value={state.type || 'all'}
          >
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
          tableId='debts-table'
          data={debts?.data || []}
          columns={debtColumns}
          loading={isLoading}
          totalRecords={debts?.totalCount || 0}
          pageSize={10}
          currentPage={state.page}
          onPageChange={handlePageChange}
          enablePagination
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onSortChange={handleSortChange}
        />
      </div>

      <AddDebtModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onDebtAdded={refetch}
        initialData={initialDebtData}
        hideTriggerButton
      />

      <InterestCalculatorModal
        isOpen={isCalcModalOpen}
        onOpenChange={setIsCalcModalOpen}
        onUseCalculation={handleUseCalculation}
      />
    </div>
  );
};

export default DebtsPage;
