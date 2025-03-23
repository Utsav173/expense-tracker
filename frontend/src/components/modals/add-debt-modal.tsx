'use client';

import { useMutation } from '@tanstack/react-query';
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
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { useQuery } from '@tanstack/react-query';
import { debtSchema } from '@/lib/utils/schema.validations';
import { apiCreateDebt } from '@/lib/endpoints/debt'; // You'll need to create this
import DateTimePicker from '../date-time-picker';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

type DebtFormSchema = z.infer<typeof debtSchema>;

const AddDebtModal = ({
  onDebtAdded,
  isOpen,
  onOpenChange
}: {
  onDebtAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const form = useForm<DebtFormSchema>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      type: 'taken',
      interestType: 'simple',
      user: '',
      description: '',
      amount: '',
      account: ''
    },
    mode: 'onSubmit'
  });

  const createDebtMutation = useMutation({
    mutationFn: (data: DebtFormSchema) => apiCreateDebt(data),
    onSuccess: async () => {
      await invalidate(['debts']);
      showSuccess('Debt created successfully!');
      form.reset();
      onDebtAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleCreate = async (data: DebtFormSchema) => {
    createDebtMutation.mutate(data);
  };

  return (
    <AddModal
      title='Add Debt'
      description='Create a new debt record.'
      triggerButton={<Button>Add Debt</Button>}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-6'>
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder='Debt description' {...field} />
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
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='Debt Amount' {...field} />
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
                <FormLabel>Premium Amount</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='premium Amount' {...field} />
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
                <FormLabel>Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select account' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingAccounts ? (
                      <SelectItem value='loading'>Loading accounts...</SelectItem>
                    ) : (
                      accountsData?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
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
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='given'>Given</SelectItem>
                    <SelectItem value='taken'>Taken</SelectItem>
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
                <FormLabel>Interest Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormLabel>Interest Percentage</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='Interest Percentage' {...field} />
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
                <FormLabel>Frequency</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='Yearly Frequency' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='dueDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date?.toISOString() || '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={createDebtMutation.isPending} className='w-full'>
            {createDebtMutation.isPending ? 'Creating...' : 'Create Debt'}
          </Button>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddDebtModal;
