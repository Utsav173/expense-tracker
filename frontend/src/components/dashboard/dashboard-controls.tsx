'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LayoutGrid, ChevronDown, SlidersHorizontal, ArrowLeft, Sun, Moon } from 'lucide-react';
import { DASHBOARD_PRESETS, PresetConfig } from '@/config/dashboard-config';
import { ModeToggle } from '../theme-toggle';
import { useRouter } from 'next/navigation';

interface DashboardControlsProps {
  currentPreset: string;
  refreshInterval: number;
  onChangePreset: (preset: string) => void;
  onSetRefreshInterval: (intervalMs: number) => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  currentPreset,
  refreshInterval,
  onChangePreset,
  onSetRefreshInterval
}) => {
  const router = useRouter();
  return (
    <div className='sticky top-4 z-20 mx-auto w-full max-w-7xl'>
      <div className='relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-black/10 backdrop-blur-sm backdrop-saturate-150 dark:border-white/10 dark:bg-black/20 dark:shadow-black/20'>
        <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-white/5' />

        <div className='relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6'>
          <div className='absolute top-4.5 left-2 sm:hidden'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => router.back()}
              className='h-8 w-8 rounded-full'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex-1 text-center sm:text-left'>
            <h1 className='bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl dark:from-white dark:to-gray-300'>
              {DASHBOARD_PRESETS[currentPreset]} Dashboard
            </h1>
          </div>

          <div className='flex items-center justify-center gap-2 sm:justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='group relative min-w-fit overflow-hidden border-white/20 bg-white/10 text-gray-900 backdrop-blur-sm hover:bg-white/20 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
                  aria-label='Select Dashboard View'
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                  <LayoutGrid className='h-4 w-4' />
                  <span className='xs:inline hidden'>
                    {DASHBOARD_PRESETS[currentPreset] || 'Select View'}
                  </span>
                  <ChevronDown className='h-3 w-3 transition-transform group-hover:rotate-180' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='border-white/20 bg-white/80 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/80'
              >
                {Object.entries(DASHBOARD_PRESETS).map(([key, value]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onChangePreset(key)}
                    className='hover:bg-white/20 dark:hover:bg-white/10'
                  >
                    {value}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='group relative min-w-fit overflow-hidden border-white/20 bg-white/10 text-gray-900 backdrop-blur-sm hover:bg-white/20 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
                  aria-label='Dashboard Options'
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                  <SlidersHorizontal className='h-4 w-4' />
                  <span className='hidden sm:inline'>Options</span>
                  <ChevronDown className='h-3 w-3 transition-transform group-hover:rotate-180' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-56 border-white/20 bg-white/80 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/80'
              >
                <DropdownMenuItem
                  onClick={() => alert('Not yet implemented')}
                  className='hover:bg-white/20 dark:hover:bg-white/10'
                >
                  Export Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator className='bg-white/20 dark:bg-white/10' />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className='hover:bg-white/20 dark:hover:bg-white/10'>
                    Automatic Refresh
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className='border-white/20 bg-white/80 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/80'>
                    <DropdownMenuItem
                      onClick={() => onSetRefreshInterval(0)}
                      className='hover:bg-white/20 dark:hover:bg-white/10'
                    >
                      Manual Only {refreshInterval === 0 && '(Active)'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onSetRefreshInterval(5 * 60 * 1000)}
                      className='hover:bg-white/20 dark:hover:bg-white/10'
                    >
                      Every 5 Minutes {refreshInterval === 300000 && '(Active)'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onSetRefreshInterval(15 * 60 * 1000)}
                      className='hover:bg-white/20 dark:hover:bg-white/10'
                    >
                      Every 15 Minutes {refreshInterval === 900000 && '(Active)'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onSetRefreshInterval(30 * 60 * 1000)}
                      className='hover:bg-white/20 dark:hover:bg-white/10'
                    >
                      Every 30 Minutes {refreshInterval === 1800000 && '(Active)'}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};
