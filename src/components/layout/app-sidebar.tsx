'use client';

import * as React from 'react';

import { NavMain } from '@/components/layout/nav/nav-main';
import { NavUser } from '@/components/layout/nav/nav-user';
import { TeamSwitcher } from '@/components/ui/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar';
import { useAuth } from '@/components/providers/auth-provider';
import { Skeleton } from '../ui/skeleton';
import { IconName } from '../ui/icon-map';

export interface NavItem {
  title: string;
  url: string;
  icon: IconName;
  disabled?: boolean;
  tooltip?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session, isLoading: userIsLoading } = useAuth();
  const user = session?.user;

  const navGroups: NavGroup[] = React.useMemo(() => {
    const hasApiKey = !!user?.hasAiApiKey;

    return [
      {
        label: 'Overview',
        items: [
          { title: 'Dashboard', url: '/dashboard', icon: 'layoutGrid' },
          { title: 'Transactions', url: '/transactions', icon: 'transactionsSidebar' }
        ]
      },
      {
        label: 'Manage',
        items: [
          { title: 'Accounts', url: '/accounts', icon: 'accountSidebar' },
          { title: 'Shared Accounts', url: '/shared-accounts', icon: 'sharedAccountsSidebar' },
          { title: 'Categories', url: '/category', icon: 'categorySidebar' },
          { title: 'Import', url: '/transactions/import', icon: 'importSidebar' }
        ]
      },
      {
        label: 'Plan',
        items: [
          { title: 'Budgets', url: '/budget', icon: 'budgetSidebar' },
          { title: 'Goals', url: '/goal', icon: 'goal' },
          { title: 'Investments', url: '/investment', icon: 'investment' },
          { title: 'Debts', url: '/debts', icon: 'debt' },
          { title: 'Statement', url: '/accounts/statement', icon: 'statementSidebar' }
        ]
      },
      {
        label: 'Intelligence',
        items: [
          {
            title: 'Expense AI',
            url: '/ai-chat',
            icon: hasApiKey ? 'ai' : 'lock',
            disabled: !hasApiKey,
            tooltip: !hasApiKey
              ? 'Configure your AI Provider in Profile to enable.'
              : 'Expense PRO AI Assistant'
          }
        ]
      }
    ];
  }, [user?.hasAiApiKey]);

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        {userIsLoading ? (
          <div className='flex items-center gap-2 p-2'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <div className='flex-1 space-y-1 group-data-[collapsible=icon]:hidden'>
              <Skeleton className='h-3 w-20' />
              <Skeleton className='h-2 w-32' />
            </div>
          </div>
        ) : (
          <NavUser />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
