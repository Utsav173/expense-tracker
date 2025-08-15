'use client';

import React, { useState, useRef, useEffect, ReactNode, HTMLAttributes, useCallback } from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BaseEllipsisProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  text?: string;
  className?: string;
  showTooltip?: boolean;
  children?: ReactNode;
  tooltipContent?: ReactNode;
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

const getTextContent = (text?: string, children?: ReactNode): string => {
  if (text) return text;
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return children.toString();
  return '';
};

const EllipsisWrapper: React.FC<{
  children: ReactNode;
  showTooltip: boolean;
  content: string;
  tooltipContent?: ReactNode;
  shouldShowTooltip?: boolean;
}> = ({ children, showTooltip, content, tooltipContent, shouldShowTooltip = true }) => {
  if (!showTooltip || !shouldShowTooltip) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side='top' className='max-w-xs break-words'>
        {tooltipContent || content}
      </TooltipContent>
    </Tooltip>
  );
};

export const SingleLineEllipsis: React.FC<BaseEllipsisProps> = ({
  text,
  className,
  showTooltip = true,
  children,
  tooltipContent,
  ...props
}) => {
  const content = getTextContent(text, children);

  if (!content) return null;

  return (
    <EllipsisWrapper showTooltip={showTooltip} content={content} tooltipContent={tooltipContent}>
      <div
        className={cn('truncate', className)}
        title={!showTooltip ? content : undefined}
        {...props}
      >
        {content}
      </div>
    </EllipsisWrapper>
  );
};

export const MultiLineEllipsis: React.FC<MultiLineEllipsisProps> = ({
  text,
  lines = 2,
  className,
  showTooltip = true,
  children,
  tooltipContent,
  ...props
}) => {
  const content = getTextContent(text, children);

  if (!content) return null;

  return (
    <EllipsisWrapper showTooltip={showTooltip} content={content} tooltipContent={tooltipContent}>
      <div
        className={cn('overflow-hidden', className)}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: lines,
          WebkitBoxOrient: 'vertical'
        }}
        title={!showTooltip ? content : undefined}
        {...props}
      >
        {content}
      </div>
    </EllipsisWrapper>
  );
};

export const EllipsisMiddle: React.FC<EllipsisMiddleProps> = ({
  text,
  startChars = 10,
  endChars = 10,
  className,
  showTooltip = true,
  tooltipContent,
  ...props
}) => {
  if (!text) return null;

  const shouldTruncate = text.length > startChars + endChars + 3;
  const displayText = shouldTruncate
    ? `${text.slice(0, startChars)}...${text.slice(-endChars)}`
    : text;

  return (
    <EllipsisWrapper
      showTooltip={showTooltip}
      content={text}
      tooltipContent={tooltipContent}
      shouldShowTooltip={shouldTruncate}
    >
      <div
        className={cn('overflow-hidden', className)}
        title={!showTooltip && shouldTruncate ? text : undefined}
        {...props}
      >
        {displayText}
      </div>
    </EllipsisWrapper>
  );
};

export const ResponsiveEllipsis: React.FC<ResponsiveEllipsisProps> = ({
  text,
  className,
  breakpoint = 'md',
  lines = 1,
  showTooltip = true,
  children,
  tooltipContent,
  ...props
}) => {
  const content = getTextContent(text, children);

  if (!content) return null;

  const breakpointClasses: Record<string, string> = {
    sm: 'sm:line-clamp-none sm:whitespace-normal',
    md: 'md:line-clamp-none md:whitespace-normal',
    lg: 'lg:line-clamp-none lg:whitespace-normal',
    xl: 'xl:line-clamp-none xl:whitespace-normal',
    '2xl': '2xl:line-clamp-none 2xl:whitespace-normal'
  };

  return (
    <EllipsisWrapper showTooltip={showTooltip} content={content} tooltipContent={tooltipContent}>
      <div
        className={cn(
          'overflow-hidden',
          lines === 1 ? 'truncate' : '',
          breakpointClasses[breakpoint],
          className
        )}
        style={
          lines > 1
            ? {
                display: '-webkit-box',
                WebkitLineClamp: lines,
                WebkitBoxOrient: 'vertical'
              }
            : undefined
        }
        title={!showTooltip ? content : undefined}
        {...props}
      >
        {content}
      </div>
    </EllipsisWrapper>
  );
};

export const DynamicEllipsis: React.FC<BaseEllipsisProps> = ({
  text,
  className,
  showTooltip = true,
  children,
  tooltipContent,
  ...props
}) => {
  const content = getTextContent(text, children);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = useCallback(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const isOverflow = element.scrollWidth > element.clientWidth;
    setIsOverflowing(isOverflow);
  }, []);

  useEffect(() => {
    if (!content) return;

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [content, checkOverflow]);

  if (!content) return null;

  return (
    <EllipsisWrapper
      showTooltip={showTooltip}
      content={content}
      tooltipContent={tooltipContent}
      shouldShowTooltip={isOverflowing}
    >
      <div
        ref={containerRef}
        className={cn('truncate', className)}
        title={!showTooltip && isOverflowing ? content : undefined}
        {...props}
      >
        {content}
      </div>
    </EllipsisWrapper>
  );
};

// Combined export for common use cases
export const Ellipsis = {
  Single: SingleLineEllipsis,
  Multi: MultiLineEllipsis,
  Middle: EllipsisMiddle,
  Responsive: ResponsiveEllipsis,
  Dynamic: DynamicEllipsis
};
