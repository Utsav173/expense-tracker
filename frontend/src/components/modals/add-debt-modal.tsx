import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import AddModal from './add-modal';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { accountGetDropdown, usersGetDropdown } from '@/lib/endpoints/accounts';
import { apiCreateDebt } from '@/lib/endpoints/debt';
import DateRangePicker from '../date-range-picker';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { useAuth } from '@/lib/hooks/useAuth';

const debtFormSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive')
  ),
  premiumAmount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Premium amount must be a number' })
      .positive('Premium amount must be positive')
      .optional()
  ),
  account: z.string().min(1, 'Account selection is required'),
  counterparty: z.string().min(1, 'Counterparty selection is required'),
  type: z.enum(['given', 'taken']),
  interestType: z.enum(['simple', 'compound']),
  percentage: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Interest percentage must be a number' })
      .min(0, 'Percentage cannot be negative')
      .optional()
  ),
  frequency: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Frequency must be a number' })
      .int('Frequency must be a whole number')
      .positive('Frequency must be positive')
      .optional()
  ),
  durationType: z.enum(['year', 'month', 'week', 'day', 'custom']),
  customDateRange: z.object({ from: z.date(), to: z.date() }).optional()
});

type DebtFormValues = z.infer<typeof debtFormSchema>;

type DebtApiPayload = {
  amount: number;
  premiumAmount?: number;
  description: string;
  duration: string;
  percentage?: number;
  frequency?: string;
  user: string;
  type: 'given' | 'taken';
  interestType: 'simple' | 'compound';
  account: string;
};

const AddDebtModal = ({
  onDebtAdded,
  isOpen,
  onOpenChange,
  hideTriggerButton = false
}: {
  onDebtAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerButton?: boolean;
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();
  const { user } = useAuth();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown,
    staleTime: 5 * 60 * 1000
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['usersDropdown'],
    queryFn: usersGetDropdown,
    staleTime: 5 * 60 * 1000
  });

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      type: 'taken',
      interestType: 'simple',
      description: '',
      amount: undefined,
      premiumAmount: undefined,
      percentage: undefined,
      frequency: undefined,
      account: '',
      counterparty: '',
      durationType: 'year',
      customDateRange: undefined
    },
    mode: 'onSubmit'
  });

  const createDebtMutation = useMutation({
    mutationFn: (data: DebtApiPayload) => apiCreateDebt(data),
    onSuccess: async () => {
      await invalidate(['debts', 'accounts']);
      showSuccess('Debt created successfully!');
      form.reset();
      onDebtAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message || error.message || 'Failed to create debt.';
      showError(message);
      console.error('Debt creation failed:', error);
    }
  });

  const handleCreate = async (formData: DebtFormValues) => {
    if (!user?.id) {
      showError('User information not found. Cannot create debt.');
      return;
    }
    if (!formData.counterparty) {
      showError('Please select a counterparty.');
      return;
    }
    let duration: string = formData.durationType;
    if (formData.durationType === 'custom' && formData.customDateRange) {
      const { from, to } = formData.customDateRange;
      if (!from || !to || from >= to) {
        showError('Invalid custom date range.');
        return;
      }
      duration = `${from.toISOString().split('T')[0]},${to.toISOString().split('T')[0]}`;
    }
    const apiPayload: DebtApiPayload = {
      amount: formData.amount,
      premiumAmount: formData.premiumAmount,
      description: formData.description,
      duration,
      percentage: formData.percentage,
      frequency: formData.frequency ? String(formData.frequency) : undefined,
      user: formData.counterparty,
      type: formData.type,
      interestType: formData.interestType,
      account: formData.account
    };
    createDebtMutation.mutate(apiPayload);
  };

  return (
    <AddModal
      title='Add Debt'
      description='Create a new debt record.'
      triggerButton={hideTriggerButton ? null : <Button>Add Debt</Button>}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-4'>
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description*</FormLabel>
                <FormControl>
                  <Input placeholder='E.g., Loan from John Doe' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='amount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount*</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='E.g., 1000.00' {...field} step='any' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='premiumAmount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premium Amount (Optional)</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='E.g., 50.00' {...field} step='any' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='account'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associated Account*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isLoadingAccounts}>
                      <SelectValue placeholder='Select account...' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingAccounts ? (
                      <SelectItem value='loading' disabled>
                        Loading accounts...
                      </SelectItem>
                    ) : accountsData && accountsData.length > 0 ? (
                      accountsData.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value='no-accounts' disabled>
                        No accounts found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='counterparty'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Counterparty*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isLoadingUsers}>
                      <SelectValue placeholder='Select user...' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <SelectItem value='loading' disabled>
                        Loading users...
                      </SelectItem>
                    ) : usersData && usersData.length > 0 ? (
                      usersData
                        .filter((u) => u.id !== user?.id)
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value='no-users' disabled>
                        No users found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='given'>Given (I lent money)</SelectItem>
                    <SelectItem value='taken'>Taken (I borrowed money)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='interestType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Type*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select interest type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='simple'>Simple</SelectItem>
                    <SelectItem value='compound'>Compound</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='percentage'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Percentage (Optional)</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='E.g., 5.5 (for 5.5%)' {...field} step='any' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='frequency'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Frequency (per year, Optional)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='E.g., 1 (Yearly), 12 (Monthly)'
                    {...field}
                    step='1'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='durationType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration*</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select duration' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='year'>Year</SelectItem>
                    <SelectItem value='month'>Month</SelectItem>
                    <SelectItem value='week'>Week</SelectItem>
                    <SelectItem value='day'>Day</SelectItem>
                    <SelectItem value='custom'>Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch('durationType') === 'custom' && (
            <FormField
              control={form.control}
              name='customDateRange'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Date Range*</FormLabel>
                  <DateRangePicker
                    dateRange={field.value}
                    setDateRange={field.onChange}
                    disabled={{ before: new Date() }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type='submit'
            disabled={createDebtMutation.isPending || isLoadingAccounts || !user?.id}
            className='w-full'
          >
            {createDebtMutation.isPending ? 'Creating...' : 'Create Debt'}
          </Button>
          {!user && <p className='text-center text-sm text-red-600'>User ID not available.</p>}
        </form>
      </Form>
    </AddModal>
  );
};

export default AddDebtModal;
