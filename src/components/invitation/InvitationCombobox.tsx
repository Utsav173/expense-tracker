'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { userSearch } from '@/lib/endpoints/users';
import { useToast } from '@/lib/hooks/useToast';
import { sendInvitation } from '@/lib/endpoints/invitation';
import { useDebouncedCallback } from 'use-debounce';
import type { SimpleUser } from '@/lib/api/api-types';

interface InvitationComboboxProps {
  value: string | ComboboxOption | null | undefined;
  onChange: (value: ComboboxOption | null | undefined) => void;
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
  const [userCache, setUserCache] = useState<Record<string, string>>({});

  const debouncedFetch = useDebouncedCallback(
    async (query: string, callback: (options: ComboboxOption[]) => void) => {
      const isEmailQuery = /\S+@\S+\.\S+/.test(query);
      let options: ComboboxOption[] = [];
      try {
        const users = await userSearch(query);
        options =
          users?.map((user: SimpleUser) => {
            // cache for later ID → email lookup
            setUserCache((prev) => ({ ...prev, [user.id]: user.email }));
            return { value: user.id, label: user.email };
          }) || [];
      } catch (error) {
        console.error('Error searching users:', error);
      }
      if (isEmailQuery && !options.some((opt) => opt.label === query)) {
        options.unshift({ value: `invite:${query}`, label: `Invite ${query}` });
      }
      callback(options);
    },
    300
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
      if (selected?.value.startsWith('invite:')) {
        const emailToInvite = selected.label.replace('Invite ', '');
        await inviteUser(emailToInvite);
        onChange(null);
      } else {
        onChange(selected ?? null);
      }
    },
    [onChange, inviteUser]
  );

  const comboboxValue = useMemo(() => {
    if (!value) return null;

    if (typeof value === 'string') {
      const label = userCache[value] ?? value;
      return { value, label };
    }

    return value;
  }, [value, userCache]);

  return (
    <Combobox
      value={comboboxValue}
      onChange={handleComboboxChange}
      fetchOptions={fetchInvitationOptions}
      placeholder={placeholder}
      noOptionsMessage='No users found. Type a full email to invite.'
      loadingPlaceholder='Searching users...'
      className={className}
      disabled={disabled || isInviting}
    />
  );
}
