'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { getSettings, updateSettings } from '@/lib/endpoints/settings';
import type { UserAPI } from '@/lib/api/api-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

type NotificationSettingsFormValues = {
  notifications: UserAPI.UserSettings['notifications'];
};

export const NotificationSettingsForm = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: getSettings
  });
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<NotificationSettingsFormValues>();

  useEffect(() => {
    if (settings) {
      form.reset({ notifications: settings.notifications });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: (data: Partial<UserAPI.UserSettings>) => updateSettings(data),
    onSuccess: () => {
      showSuccess('Notification settings saved!');
      invalidate(['userSettings']);
      form.reset(form.getValues());
    },
    onError: (err: any) => showError(err.message)
  });

  const onSubmit = (data: NotificationSettingsFormValues) => {
    mutation.mutate({ notifications: data.notifications });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-72' />
        </CardHeader>
        <CardContent className='space-y-6'>
          <Skeleton className='h-16 w-full' />
          <div className='space-y-4 pl-6'>
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-8 w-full' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Control which emails you receive from us.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <Controller
              control={form.control}
              name='notifications.enableAll'
              render={({ field }) => (
                <div className='flex items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='enableAll' className='text-base font-medium'>
                      Enable All Notifications
                    </Label>
                    <p className='text-muted-foreground text-sm'>
                      Master switch for all email notifications.
                    </p>
                  </div>
                  <Switch id='enableAll' checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <div className='ml-2 space-y-4 border-l-2 pl-4'>
              {[
                { key: 'budgetAlerts', label: 'Budget Alerts' },
                { key: 'goalReminders', label: 'Saving Goal Reminders' },
                { key: 'billReminders', label: 'Upcoming Bill Reminders' }
              ].map((item) => (
                <Controller
                  key={item.key}
                  control={form.control}
                  name={`notifications.${item.key as 'budgetAlerts' | 'goalReminders' | 'billReminders'}`}
                  render={({ field }) => (
                    <div className='flex items-center justify-between'>
                      <Label htmlFor={item.key}>{item.label}</Label>
                      <Switch
                        id={item.key}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch('notifications.enableAll')}
                      />
                    </div>
                  )}
                />
              ))}
            </div>
            <div className='flex justify-end border-t pt-6'>
              <Button type='submit' disabled={mutation.isPending || !form.formState.isDirty}>
                {mutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save Notifications
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
