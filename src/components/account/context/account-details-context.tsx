'use client';

import React, { createContext, useContext } from 'react';
import { useAccountDetailsData } from '../hooks/useAccountDetailsData';

type AccountDetailsContextType = ReturnType<typeof useAccountDetailsData> & { id: string };

const AccountDetailsContext = createContext<AccountDetailsContextType | null>(null);

export const useAccountDetails = () => {
  const context = useContext(AccountDetailsContext);
  if (!context) {
    throw new Error('useAccountDetails must be used within an AccountDetailsProvider');
  }
  return context;
};

interface AccountDetailsProviderProps {
  id: string;
  searchParams: any;
  children: React.ReactNode;
}

export const AccountDetailsProvider: React.FC<AccountDetailsProviderProps> = ({
  id,
  searchParams,
  children
}) => {
  const data = useAccountDetailsData(id, searchParams);
  return (
    <AccountDetailsContext.Provider value={{ ...data, id }}>
      {children}
    </AccountDetailsContext.Provider>
  );
};
