'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useToast } from '@/lib/hooks/useToast';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Icon } from '@/components/ui/icon';

export function NavUser() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { isMobile, state } = useSidebar();

  const { showError } = useToast();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/auth/login';
        },
        onError: () => {
          showError('Error in logging out');
        }
      }
    });
  };

  if (!user) return null;

  return (
    <SidebarMenu className='px-0'>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0! ${state === 'collapsed' ? 'justify-center px-0' : ''}`}
              tooltip={state === 'collapsed' ? `${user.name}\n${user.email}` : undefined}
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage src={user?.image!} alt={user.name} />
                <AvatarFallback className='rounded-lg'>{user.name.split('')[0]}</AvatarFallback>
              </Avatar>
              {state !== 'collapsed' && (
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>{user.name}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
              )}
              {state !== 'collapsed' && <Icon name='chevronsUpDown' className='ml-auto size-4' />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={user?.image!} alt={user.name} />
                  <AvatarFallback className='rounded-lg'>{user.name.split('')[0]}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>{user.name}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/profile`} prefetch>
                  <Icon name='user' className='mr-2 h-4 w-4' />
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <Icon name='logOut' className='mr-2 h-4 w-4' />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
