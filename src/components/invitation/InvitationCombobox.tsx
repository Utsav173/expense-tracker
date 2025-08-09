'use client';

import React, { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { userSearch } from '@/lib/endpoints/users';
import { useToast } from '@/lib/hooks/useToast';
import { sendInvitation } from '@/lib/endpoints/invitation';
import { useDebouncedCallback } from 'use-debounce';
import type { SimpleUser } from '@/lib/api/api-types';

interface InvitationComboboxProps {
  value?: ComboboxOption | null;
  onChange?: (value: ComboboxOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function InvitationCombobox({
  value,
  onChange,
  disabled,
  placeholder = 'Select user or invite...',
  className
}: InvitationComboboxProps) {
  const { showSuccess, showError } = useToast();

  const isEmail = value?.value ? /\S+@\S+\.\S+/.test(value.value) : false;

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['userById', value?.value],
    queryFn: async () => {
      if (!value?.value || isEmail) return null;
      const res = await userSearch(value.value);
      return res?.find((u: SimpleUser) => u.id === value.value) ?? null;
    },
    enabled: !!value?.value && !isEmail,
    staleTime: Infinity,
    gcTime: Infinity
  });

  const debouncedFetch = useDebouncedCallback(
    async (query: string, callback: (options: ComboboxOption[]) => void) => {
      const isEmailQuery = /\S+@\S+\.\S+/.test(query);
      let options: ComboboxOption[] = [];
      try {
        const res = await userSearch(query);
        options =
          res?.map((user: SimpleUser) => ({
            value: user.id,
            label: user.email
          })) || [];
      } catch (error) {
        console.error('Error searching users:', error);
      }
      if (isEmailQuery && !options.some((opt) => opt.label === query)) {
        options.unshift({ value: `invite:${query}`, label: query });
      }
      callback(options);
    },
    700
  );

  const fetchInvitationOptions = useCallback(
    (query: string) =>
      new Promise<ComboboxOption[]>((resolve) => {
        debouncedFetch(query, resolve);
      }),
    [debouncedFetch]
  );

  const { mutateAsync: inviteUser, isPending: isInviting } = useMutation({
    mutationFn: (email: string) => sendInvitation(email),
    onSuccess: () => showSuccess('Invitation sent successfully!'),
    onError: (error) => showError(error.message || 'Failed to send invitation.')
  });

  const handleComboboxChange = useCallback(
    async (selected: ComboboxOption | null) => {
      if (!selected) {
        onChange?.(null);
        return;
      }
      if (selected.value.startsWith('invite:')) {
        const emailToInvite = selected.label;
        await inviteUser(emailToInvite);
        onChange?.(null);
      } else {
        onChange?.(selected);
      }
    },
    [onChange, inviteUser]
  );

  const comboboxValue = useMemo(() => {
    if (!value) return null;
    if (isLoadingUser) return null;
    if (isEmail) {
      return { value: value.value, label: value.label };
    }
    if (user) {
      return { value: user.id, label: user.email };
    }
    return value;
  }, [value, user, isEmail, isLoadingUser]);

  return (
    <Combobox
      value={comboboxValue}
      onChange={handleComboboxChange}
      fetchOptions={fetchInvitationOptions}
      placeholder={placeholder}
      noOptionsMessage='No matching users found. Type a full email to invite a new user.'
      loadingPlaceholder='Searching users...'
      className={className}
      disabled={disabled || isInviting || isLoadingUser}
    />
  );
}
