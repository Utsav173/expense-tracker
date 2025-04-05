'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EllipsisTextProps extends React.HTMLAttributes<HTMLElement> {
  /** The text content to display and potentially truncate. */
  text: string | null | undefined;
  /** Optional: The HTML element type to render. Defaults to 'span'. */
  as?: React.ElementType;
  /** Optional: TooltipProvider delay duration in milliseconds. Defaults to 100ms. */
  tooltipDelay?: number;
  /** Optional: Maximum width for the tooltip content. Defaults to 'max-w-xs'. */
  tooltipMaxWidth?: string;
  /** Optional: Width for the container. If not provided, parent must constrain width */
  width?: string;
}

/**
 * A component that renders text using a specified HTML element (defaulting to 'span')
 * and displays a tooltip with the full text if the content overflows and is truncated.
 * It uses ResizeObserver to efficiently detect size changes.
 */
const EllipsisText = React.forwardRef<HTMLElement, EllipsisTextProps>(
  (
    {
      className,
      text,
      as: Component = 'span',
      tooltipDelay = 100,
      tooltipMaxWidth = 'max-w-xs',
      width,
      style,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLElement>(null);
    const [isTruncated, setIsTruncated] = React.useState(false);

    React.useImperativeHandle(ref, () => internalRef.current!, []);

    const checkTruncation = React.useCallback(() => {
      const element = internalRef.current;
      if (element) {
        const currentlyTruncated = element.scrollWidth > element.offsetWidth;
        setIsTruncated(currentlyTruncated);
      }
    }, []);

    React.useLayoutEffect(() => {
      const element = internalRef.current;
      if (!element) return;

      checkTruncation();

      const observer = new ResizeObserver(() => {
        checkTruncation();
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, [checkTruncation, text]);

    // Combine provided style with width if provided
    const combinedStyle = width ? { ...style, width } : style;

    const contentElement = (
      <Component
        ref={internalRef}
        className={cn('block overflow-hidden text-ellipsis whitespace-nowrap', className)}
        style={combinedStyle}
        {...props}
      >
        {text || ''}
      </Component>
    );

    if (text && isTruncated) {
      return (
        <TooltipProvider delayDuration={tooltipDelay}>
          <Tooltip>
            <TooltipTrigger asChild>{contentElement}</TooltipTrigger>
            <TooltipContent>
              <div className={cn('break-words', tooltipMaxWidth)}>{text}</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return contentElement;
  }
);

EllipsisText.displayName = 'EllipsisText';

export { EllipsisText };
