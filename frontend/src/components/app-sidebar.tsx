'use client';

import * as React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Coins,
  Import,
  LayoutDashboard,
  PiggyBank,
  Tag,
  Wallet
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/hooks/useAuth';

// This is sample data.
const data: any[] = [
  {
    title: 'Accounts',
    url: '/',
    icon: Wallet
  },
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Transactions',
    url: '/transactions',
    icon: ArrowLeftRight
  },
  {
    title: 'Import Transactions',
    url: '/transactions/import',
    icon: Import
  },
  {
    title: 'Categories',
    url: '/category',
    icon: Tag
  },
  {
    title: 'Budgets',
    url: '/budget',
    icon: BookOpen
  },
  {
    title: 'Goals',
    url: '/goal',
    icon: PiggyBank
  },

  {
    title: 'Investments',
    url: '/investment',
    icon: BarChart3
  },

  {
    title: 'Debts',
    url: '/debts',
    icon: Coins
  }
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data} />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
