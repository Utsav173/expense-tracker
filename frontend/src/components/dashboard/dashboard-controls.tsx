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
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { RefreshCw, LayoutGrid, ChevronDown, SlidersHorizontal, Sun, Moon } from 'lucide-react';
import { DASHBOARD_PRESETS, PresetConfig } from '@/config/dashboard-config';

interface DashboardControlsProps {
  currentPreset: string;
  layoutConfig: Record<string, PresetConfig[string]>;
  hiddenSections: Set<string>;
  refreshInterval: number;
  isDarkMode: boolean;
  isRefreshing: boolean;
  isLoading: boolean;
  onChangePreset: (preset: string) => void;
  onToggleSectionVisibility: (sectionId: string) => void;
  onSetRefreshInterval: (intervalMs: number) => void;
  onToggleDarkMode: () => void;
  onRefetchAll: () => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  currentPreset,
  layoutConfig,
  hiddenSections,
  refreshInterval,
  isDarkMode,
  isRefreshing,
  isLoading,
  onChangePreset,
  onToggleSectionVisibility,
  onSetRefreshInterval,
  onToggleDarkMode,
  onRefetchAll
}) => {
  return (
    <div className='sticky top-0 z-20 flex w-full flex-col gap-4 border-b border-white/20 bg-white/10 px-2 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5'>
      <h1 className='text-3xl font-bold'>{DASHBOARD_PRESETS[currentPreset]} Dashboard</h1>

      <div className='flex flex-wrap items-center gap-2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='flex items-center gap-2'>
              <LayoutGrid className='h-4 w-4' />
              {DASHBOARD_PRESETS[currentPreset] || 'Select View'}
              <ChevronDown className='h-3 w-3' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {Object.entries(DASHBOARD_PRESETS).map(([key, value]) => (
              <DropdownMenuItem key={key} onClick={() => onChangePreset(key)}>
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='flex items-center gap-2'>
              <SlidersHorizontal className='h-4 w-4' />
              <span className='hidden sm:inline'>Options</span>
              <ChevronDown className='h-3 w-3' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            {Object.entries(layoutConfig || {}).map(([id, config]) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={!hiddenSections.has(id)}
                onCheckedChange={() => onToggleSectionVisibility(id)}
                onSelect={(e) => e.preventDefault()}
              >
                {config.title}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => alert('Export feature coming soon')}>
              Export Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>Print View</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Automatic Refresh</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onSetRefreshInterval(0)}>
                  Manual Only {refreshInterval === 0 && '(Active)'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetRefreshInterval(5 * 60 * 1000)}>
                  Every 5 Minutes {refreshInterval === 300000 && '(Active)'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetRefreshInterval(15 * 60 * 1000)}>
                  Every 15 Minutes {refreshInterval === 900000 && '(Active)'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetRefreshInterval(30 * 60 * 1000)}>
                  Every 30 Minutes {refreshInterval === 1800000 && '(Active)'}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleDarkMode}>
              <div className='flex w-full items-center justify-between'>
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                {isDarkMode ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={isRefreshing ? 'outline' : 'default'}
          size='sm'
          onClick={onRefetchAll}
          disabled={isRefreshing || isLoading}
          className='min-w-[110px]'
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
    </div>
  );
};
