'use client';

import React from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  RefreshCw,
  LayoutGrid,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  Sun,
  Moon,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { DASHBOARD_PRESETS, PresetConfig, TIME_RANGES } from '@/config/dashboard-config';

interface DashboardControlsProps {
  currentPreset: string;
  timeRangeOption: string;
  customDateRange?: DateRange;
  layoutConfig: Record<string, PresetConfig[string]>;
  hiddenSections: Set<string>;
  refreshInterval: number;
  isDarkMode: boolean;
  compactView: boolean;
  isRefreshing: boolean;
  isLoading: boolean;
  onChangePreset: (preset: string) => void;
  onTimeRangeChange: (rangeValue: string) => void;
  onCustomDateSelect: (range: DateRange | undefined) => void;
  onToggleSectionVisibility: (sectionId: string) => void;
  onSetRefreshInterval: (intervalMs: number) => void;
  onToggleDarkMode: () => void;
  onToggleCompactView: () => void;
  onRefetchAll: () => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  currentPreset,
  timeRangeOption,
  customDateRange,
  layoutConfig,
  hiddenSections,
  refreshInterval,
  isDarkMode,
  compactView,
  isRefreshing,
  isLoading,
  onChangePreset,
  onTimeRangeChange,
  onCustomDateSelect,
  onToggleSectionVisibility,
  onSetRefreshInterval,
  onToggleDarkMode,
  onToggleCompactView,
  onRefetchAll
}) => {
  return (
    <div className='sticky top-0 z-20 flex w-full flex-col gap-4 border-b border-white/20 bg-white/10 py-4 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between'>
      <h1 className='text-3xl font-bold'>Dashboard</h1>

      <div className='flex flex-wrap items-center gap-2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              {timeRangeOption === 'custom'
                ? customDateRange?.from && customDateRange?.to
                  ? `${format(customDateRange.from, 'P')} - ${format(customDateRange.to, 'P')}`
                  : 'Custom Range'
                : TIME_RANGES.find((r) => r.value === timeRangeOption)?.label || 'Select Range'}
              <ChevronDown className='h-3 w-3' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {TIME_RANGES.filter((r) => r.value !== 'custom').map((range) => (
              <DropdownMenuItem key={range.value} onClick={() => onTimeRangeChange(range.value)}>
                {range.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DatePickerWithRange
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Custom Range...
                </DropdownMenuItem>
              }
              onDateChange={onCustomDateSelect}
              initialDate={customDateRange}
            />
          </DropdownMenuContent>
        </DropdownMenu>

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
            <DropdownMenuItem onClick={onToggleCompactView}>
              <div className='flex w-full items-center justify-between'>
                <span>{compactView ? 'Normal View' : 'Compact View'}</span>
                {compactView ? (
                  <Maximize2 className='h-4 w-4' />
                ) : (
                  <Minimize2 className='h-4 w-4' />
                )}
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
