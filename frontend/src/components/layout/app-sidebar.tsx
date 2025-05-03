'use client'; // Make this a client component to use hooks

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
  Wallet,
  Users,
  BrainCircuit,
  Lock // Icon for disabled state
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
import { useAuth } from '@/lib/hooks/useAuth';
import { Skeleton } from '../ui/skeleton'; // Import Skeleton

// Define the structure for navigation items, including disabled state
export interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  disabled?: boolean;
  tooltip?: string; // Tooltip message for disabled items
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, userIsLoading } = useAuth(); // Get user and loading state

  // Define navigation data dynamically based on user auth state
  const navData: NavItem[] = React.useMemo(() => {
    const hasApiKey = !!user?.hasAiApiKey;

    return [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Accounts', url: '/', icon: Wallet },
      { title: 'Shared Accounts', url: '/shared-accounts', icon: Users },
      { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
      { title: 'Import Transactions', url: '/transactions/import', icon: Import },
      { title: 'Categories', url: '/category', icon: Tag },
      { title: 'Budgets', url: '/budget', icon: BookOpen },
      { title: 'Goals', url: '/goal', icon: PiggyBank },
      { title: 'Investments', url: '/investment', icon: BarChart3 },
      { title: 'Debts', url: '/debts', icon: Coins },
      {
        title: 'AI Assistant',
        url: '/ai-chat',
        icon: hasApiKey ? BrainCircuit : Lock, // Change icon if disabled
        disabled: !hasApiKey, // Disable if no API key
        tooltip: !hasApiKey ? 'Add your AI API Key in Profile to enable.' : undefined
      }
    ];
  }, [user?.hasAiApiKey]); // Depend on the hasAiApiKey flag

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* Pass the dynamic navData */}
        <NavMain items={navData} />
      </SidebarContent>
      <SidebarFooter>
        {userIsLoading ? (
          <div className='flex items-center gap-2 p-2'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <div className='flex-1 space-y-1'>
              <Skeleton className='h-3 w-3/4' />
              <Skeleton className='h-3 w-full' />
            </div>
          </div>
        ) : user ? (
          <NavUser user={user} />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
