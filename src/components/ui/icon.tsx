import React from 'react';
import { Icon as Iconify } from '@iconify/react';
import { iconMap, IconName } from './icon-map';

/**
 * Defines the props for the custom Icon component.
 * It uses a specific `IconName` from our centralized map and extends
 * `React.HTMLAttributes<SVGSVGElement>` to safely accept common props like
 * `className`, `style`, and `onClick` without conflicting with Iconify's internal props.
 */
interface IconProps extends React.HTMLAttributes<SVGSVGElement> {
  name: IconName;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, onLoad, ...props }, ref) => {
    const iconString = iconMap[name];

    return <Iconify ref={ref} icon={iconString} {...props} />;
  }
);

Icon.displayName = 'Icon';
