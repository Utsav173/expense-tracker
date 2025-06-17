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
import { LayoutGrid, ChevronDown, SlidersHorizontal, Sun, Moon, ArrowLeft } from 'lucide-react';
import { DASHBOARD_PRESETS, PresetConfig } from '@/config/dashboard-config';
import { ModeToggle } from '../theme-toggle';
import { useRouter } from 'next/navigation';

interface DashboardControlsProps {
  currentPreset: string;
  layoutConfig: Record<string, PresetConfig[string]>;
  hiddenSections: Set<string>;
  refreshInterval: number;
  isDarkMode: boolean;
  onChangePreset: (preset: string) => void;
  onToggleSectionVisibility: (sectionId: string) => void;
  onSetRefreshInterval: (intervalMs: number) => void;
  onToggleDarkMode: () => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  currentPreset,
  layoutConfig,
  hiddenSections,
  refreshInterval,
  isDarkMode,
  onChangePreset,
  onToggleSectionVisibility,
  onSetRefreshInterval,
  onToggleDarkMode
}) => {
  const router = useRouter();
  return (
    <div className='sticky top-5 z-20 flex w-full flex-col gap-4 rounded-lg border border-white/20 bg-white/10 px-2 py-3 backdrop-blur-xl max-sm:px-1 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5'>
      <div className='absolute top-2 left-2 hidden max-sm:block'>
        <Button variant='ghost' size='icon' onClick={() => router.back()}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
      </div>

      {/* Responsive Dashboard Title */}
      <h1 className='text-foreground text-2xl font-bold tracking-tight whitespace-nowrap max-sm:mx-auto sm:text-3xl'>
        {DASHBOARD_PRESETS[currentPreset]} Dashboard
      </h1>

      {/* Controls Row: horizontally scrollable on mobile */}
      <div
        className='scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent flex flex-nowrap items-center gap-2 overflow-x-auto py-1 max-sm:mx-auto max-sm:px-2 sm:flex-wrap sm:overflow-x-visible'
        tabIndex={-1}
      >
        {/* Preset Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='flex min-w-fit items-center gap-2'
              aria-label='Select Dashboard View'
            >
              <LayoutGrid className='h-4 w-4' />
              <span className='xs:inline hidden'>
                {DASHBOARD_PRESETS[currentPreset] || 'Select View'}
              </span>
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

        {/* Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='flex min-w-fit items-center gap-2'
              aria-label='Dashboard Options'
            >
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

        <ModeToggle />
      </div>
    </div>
  );
};
