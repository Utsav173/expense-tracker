import React from 'react';
import { Icon as Iconify } from '@iconify/react';
import { iconMap, IconName } from './icon-map';
import { cn } from '@/lib/utils';

/**
 * Defines the props for the custom Icon component.
 * It uses a specific `IconName` from our centralized map and extends
 * `React.HTMLAttributes<SVGSVGElement>` to safely accept common props like
 * `className`, `style`, and `onClick` without conflicting with Iconify's internal props.
 */
interface IconProps extends React.HTMLAttributes<SVGSVGElement> {
  name: IconName;
  filled?: boolean;
  className?: string;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, onLoad, filled, className, ...props }, ref) => {
    const iconString = iconMap[name];
    return (
      <Iconify
        ref={ref as any}
        icon={iconString}
        color='currentColor'
        className={cn(
          '[&>svg]:h-6 [&>svg]:w-6 [&>svg]:stroke-current',
          filled ? '[&>svg]:fill-current' : '[&>svg]:fill-transparent',
          className
        )}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';
