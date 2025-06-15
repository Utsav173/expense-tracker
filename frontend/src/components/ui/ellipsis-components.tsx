'use client';

import React, { useState, useRef, useEffect, ReactNode, HTMLAttributes } from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BaseEllipsisProps extends HTMLAttributes<HTMLDivElement> {
  text?: string;
  className?: string;
  showTooltip?: boolean;
  children?: ReactNode;
}

interface MultiLineEllipsisProps extends BaseEllipsisProps {
  lines?: number;
}

interface EllipsisMiddleProps extends Omit<BaseEllipsisProps, 'children'> {
  text: string;
  startChars?: number;
  endChars?: number;
}

interface ResponsiveEllipsisProps extends BaseEllipsisProps {
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  lines?: number;
}

/**
 * SingleLineEllipsis - Truncates text to a single line with ellipsis
 */
export const SingleLineEllipsis: React.FC<BaseEllipsisProps> = ({
  text,
  className,
  showTooltip = true,
  children,
  ...props
}) => {
  const content = text || (children as string);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('max-w-full truncate sm:w-auto', className)} {...props}>
          {content}
        </div>
      </TooltipTrigger>
      {showTooltip && <TooltipContent>{content}</TooltipContent>}
    </Tooltip>
  );
};

/**
 * MultiLineEllipsis - Truncates text to specified number of lines with ellipsis
 */
export const MultiLineEllipsis: React.FC<MultiLineEllipsisProps> = ({
  text,
  lines = 2,
  className,
  showTooltip = true,
  children,
  ...props
}) => {
  const content = text || (children as string);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn('overflow-hidden', className)}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: lines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
          {...props}
        >
          {content}
        </div>
      </TooltipTrigger>
      {showTooltip && <TooltipContent>{content}</TooltipContent>}
    </Tooltip>
  );
};

/**
 * EllipsisMiddle - Truncates text in the middle with ellipsis
 */
export const EllipsisMiddle: React.FC<EllipsisMiddleProps> = ({
  text,
  startChars = 10,
  endChars = 10,
  className,
  showTooltip = true,
  ...props
}) => {
  if (!text) return null;

  const shouldTruncate = text.length > startChars + endChars + 3;
  const displayText = shouldTruncate
    ? `${text.slice(0, startChars)}...${text.slice(-endChars)}`
    : text;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('overflow-hidden', className)} {...props}>
          {displayText}
        </div>
      </TooltipTrigger>
      {showTooltip && shouldTruncate && <TooltipContent>{text}</TooltipContent>}
    </Tooltip>
  );
};

/**
 * ResponsiveEllipsis - Shows full text on larger screens, truncates on smaller screens
 */
export const ResponsiveEllipsis: React.FC<ResponsiveEllipsisProps> = ({
  text,
  className,
  breakpoint = 'md',
  lines = 1,
  showTooltip = true,
  children,
  ...props
}) => {
  const content = text || (children as string);

  const responsiveClasses: Record<string, string> = {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block',
    '2xl': 'hidden 2xl:block'
  };

  const mobileClasses: Record<string, string> = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
    xl: 'xl:hidden',
    '2xl': '2xl:hidden'
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(mobileClasses[breakpoint], className)}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: lines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            {...props}
          >
            {content}
          </div>
        </TooltipTrigger>
        {showTooltip && <TooltipContent>{content}</TooltipContent>}
      </Tooltip>
    </>
  );
};

/**
 * DynamicEllipsis - Measures container and truncates text if it overflows
 */
export const DynamicEllipsis: React.FC<BaseEllipsisProps> = ({
  text,
  className,
  showTooltip = true,
  children,
  ...props
}) => {
  const content = text || (children as string);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const isOverflow = textRef.current.scrollWidth > containerRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };

    checkOverflow();

    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [content]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={containerRef}
          className={cn('overflow-hidden whitespace-nowrap', className)}
          {...props}
        >
          <span ref={textRef}>{content}</span>
        </div>
      </TooltipTrigger>
      {showTooltip && isOverflowing && <TooltipContent>{content}</TooltipContent>}
    </Tooltip>
  );
};
