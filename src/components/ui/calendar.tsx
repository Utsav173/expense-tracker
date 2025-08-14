'use client';

import * as React from 'react';
import { ClassNames, DayFlag, DayPicker, SelectionState, UI } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from './icon';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames: ClassNames = {
    months: 'relative flex flex-col sm:flex-row gap-4',
    month: 'w-full',
    month_caption: 'relative mx-10 mb-1 flex h-9 items-center justify-center z-20',
    caption_label: 'text-sm font-medium',
    nav: 'absolute top-0 flex w-full justify-between z-10',
    button_previous: cn(
      buttonVariants({ variant: 'ghost' }),
      'size-9 text-muted-foreground/80 hover:text-foreground p-0'
    ),
    button_next: cn(
      buttonVariants({ variant: 'ghost' }),
      'size-9 text-muted-foreground/80 hover:text-foreground p-0'
    ),
    weekday: 'size-9 p-0 text-xs font-medium text-muted-foreground/80',
    day_button:
      'relative flex size-9 items-center justify-center whitespace-nowrap rounded-md p-0 text-foreground group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 group-data-disabled:pointer-events-none focus-visible:z-10 not-in-data-selected:hover:bg-accent group-data-selected:bg-primary not-in-data-selected:hover:text-foreground group-data-selected:text-primary-foreground group-data-disabled:text-foreground/30 group-data-disabled:line-through group-data-outside:text-foreground/30 group-data-outside:group-data-selected:text-primary-foreground outline-hidden focus-visible:ring-ring/50 focus-visible:ring-[3px] group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-data-selected:group-[.range-middle]:bg-accent group-data-selected:group-[.range-middle]:text-foreground',
    day: 'group size-9 px-0 py-px text-sm',
    range_start: 'range-start',
    range_end: 'range-end',
    range_middle: 'range-middle',
    today:
      '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors',
    outside: 'text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground',
    hidden: 'invisible',
    week_number: 'size-9 p-0 text-xs font-medium text-muted-foreground/80',
    [UI.Root]: '',
    [UI.Chevron]: '',
    [UI.Dropdowns]: '',
    [UI.Dropdown]: '',
    [UI.DropdownRoot]: '',
    [UI.Footer]: '',
    [UI.MonthGrid]: '',
    [UI.MonthsDropdown]: '',
    [UI.Week]: '',
    [UI.Weeks]: '',
    [UI.Weekdays]: '',
    [UI.WeekNumberHeader]: '',
    [UI.YearsDropdown]: '',
    [SelectionState.selected]: '',
    [DayFlag.focused]: '',
    caption_after_enter: '',
    caption_after_exit: '',
    caption_before_enter: '',
    caption_before_exit: '',
    disabled: '',
    weeks_before_enter: '',
    weeks_before_exit: '',
    weeks_after_enter: '',
    weeks_after_exit: ''
  };

  const mergedClassNames: typeof defaultClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
            defaultClassNames[key as keyof typeof defaultClassNames],
            classNames[key as keyof typeof classNames]
          )
        : defaultClassNames[key as keyof typeof defaultClassNames]
    }),
    {} as typeof defaultClassNames
  );

  const defaultComponents = {
    Chevron: (props: {
      className?: string;
      size?: number;
      disabled?: boolean;
      orientation?: 'left' | 'right' | 'up' | 'down';
    }) => {
      if (props.orientation === 'left') {
        return <Icon name='chevronLeft' size={16} {...props} aria-hidden='true' />;
      }
      return <Icon name='chevronRight' size={16} {...props} aria-hidden='true' />;
    }
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-fit', className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}

export { Calendar };
