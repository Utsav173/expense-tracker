'use client';

import * as React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Bot,
  Coins,
  LayoutDashboard,
  PiggyBank,
  Settings2,
  SquareTerminal,
  Tag,
  Wallet
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
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

const projects = [
  {
    name: 'settings',
    url: '/settings',
    icon: Settings2
  },
  {
    name: 'Profile ',
    url: '/profile',
    icon: Bot
  }
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const teams = [
    {
      name: user?.name || 'Your Profile ',
      logo: SquareTerminal,
      plan: 'user-type'
    }
  ];

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
