'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useQuery } from '@tanstack/react-query';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { debtSchema } from '@/lib/utils/schema.validations';
import { apiUpdateDebt } from '@/lib/endpoints/debt'; // You'll need to create this
import { Debts } from '@/lib/types';
import DateTimePicker from '../date-time-picker';
import { format } from 'date-fns';

const debtUpdateSchema = debtSchema.omit({ user: true }); // Exclude user

type DebtFormSchema = z.infer<typeof debtUpdateSchema>;

interface UpdateDebtModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debts;
  onDebtUpdated: () => void;
}

const UpdateDebtModal: React.FC<UpdateDebtModalProps> = ({
  isOpen,
  onOpenChange,
  debt,
  onDebtUpdated
}) => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const form = useForm<DebtFormSchema>({
    resolver: zodResolver(debtUpdateSchema),
    defaultValues: {
      amount: debt.amount.toString(),
      premiumAmount: debt.premiumAmount?.toString(),
      description: debt.description,
      dueDate: debt.dueDate ? format(new Date(debt.dueDate), 'yyyy-MM-dd') : '',
      type: debt.type as 'given' | 'taken',
      interestType: debt.interestType as 'simple' | 'compound',
      account: debt.account,
      percentage: debt.percentage?.toString(),
      frequency: debt.frequency
    },
    mode: 'onSubmit'
  });

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiUpdateDebt(id, data), // Use the new API function
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      showSuccess('Debt updated successfully!');
      onOpenChange(false);
      onDebtUpdated();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdate = async (data: DebtFormSchema) => {
    await updateDebtMutation.mutate({
      id: debt.id,
      data: {
        ...data,
        amount: Number(data.amount),
        premiumAmount: data.premiumAmount ? Number(data.premiumAmount) : undefined,
        percentage: data.percentage ? Number(data.percentage) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Debt</DialogTitle>
          <DialogDescription>Update your debt information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-4'>
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
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit' disabled={updateDebtMutation.isPending}>
                {updateDebtMutation.isPending ? 'Updating...' : 'Update Debt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDebtModal;
