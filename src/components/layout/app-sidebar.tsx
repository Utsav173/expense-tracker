'use client';

import * as React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Coins,
  FileDown,
  LayoutGrid,
  PiggyBank,
  Tags,
  Users2,
  Wallet,
  BrainCircuit,
  Lock,
  UploadCloud
} from 'lucide-react';

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

export interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
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

  // RESTRUCTURED: Navigation data is now grouped logically
  const navGroups: NavGroup[] = React.useMemo(() => {
    const hasApiKey = !!user?.hasAiApiKey;

    return [
      {
        label: 'Overview',
        items: [
          { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
          { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight }
        ]
      },
      {
        label: 'Manage',
        items: [
          { title: 'Accounts', url: '/accounts', icon: Wallet },
          { title: 'Shared Accounts', url: '/shared-accounts', icon: Users2 },
          { title: 'Categories', url: '/category', icon: Tags },
          { title: 'Import', url: '/transactions/import', icon: UploadCloud }
        ]
      },
      {
        label: 'Plan',
        items: [
          { title: 'Budgets', url: '/budget', icon: BookOpen },
          { title: 'Goals', url: '/goal', icon: PiggyBank },
          { title: 'Investments', url: '/investment', icon: BarChart3 },
          { title: 'Debts', url: '/debts', icon: Coins },
          { title: 'Statement', url: '/accounts/statement', icon: FileDown }
        ]
      },
      {
        label: 'Intelligence',
        items: [
          {
            title: 'AI Assistant',
            url: '/ai-chat',
            icon: hasApiKey ? BrainCircuit : Lock,
            disabled: !hasApiKey,
            tooltip: !hasApiKey
              ? 'Add your AI API Key in Profile to enable.'
              : 'AI Financial Assistant'
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
