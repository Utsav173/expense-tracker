import type { MDXComponents } from 'mdx/types';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Alert as UiAlert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { IconName } from './components/ui/icon-map';
import React from 'react';

const Alert = ({
  title,
  children,
  variant = 'default'
}: {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'tip';
}) => {
  const iconMap: Record<string, IconName> = {
    default: 'info',
    destructive: 'alertTriangle',
    success: 'checkCircle',
    tip: 'lightbulb'
  };
  const variantClasses: Record<string, string> = {
    default:
      'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 [&>svg]:text-blue-500',
    destructive:
      'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 text-red-800 dark:text-red-200 [&>svg]:text-red-500',
    success:
      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 text-green-800 dark:text-green-200 [&>svg]:text-green-500',
    tip: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 [&>svg]:text-amber-500'
  };

  return (
    <UiAlert className={cn('my-6', variantClasses[variant])}>
      <Icon name={iconMap[variant]} className='h-4 w-4' />
      {title && <AlertTitle className='font-bold'>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </UiAlert>
  );
};

// Custom component for keyboard shortcut styles
const Keybind = ({ children }: { children: React.ReactNode }) => (
  <kbd className='text-muted-foreground bg-muted border-border rounded-md border px-2 py-1.5 text-xs font-semibold shadow-sm'>
    {children}
  </kbd>
);

// This is the main function that provides all components to MDX
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Override standard HTML elements with beautifully styled versions
    h2: ({ className, children, ...props }) => {
      const iconMatch = React.Children.toArray(children).find(
        (child: any) => child.props?.mdxType === 'Icon'
      );
      const textChildren = React.Children.toArray(children).filter(
        (child: any) => child.props?.mdxType !== 'Icon'
      );
      return (
        <h2
          className={cn(
            'mt-12 flex items-center gap-3 border-b pb-3 text-3xl font-bold tracking-tight first:mt-0',
            className
          )}
          {...props}
        >
          {iconMatch}
          <span>{textChildren}</span>
        </h2>
      );
    },
    h3: ({ className, ...props }) => (
      <h3 className={cn('mt-8 text-2xl font-semibold tracking-tight', className)} {...props} />
    ),
    p: ({ className, ...props }) => (
      <p className={cn('text-base leading-7 [&:not(:first-child)]:mt-4', className)} {...props} />
    ),
    ul: ({ className, ...props }) => (
      <ul className={cn('my-6 ml-6 list-disc [&>li]:mt-3', className)} {...props} />
    ),
    ol: ({ className, ...props }) => (
      <ol className={cn('my-6 ml-6 list-decimal [&>li]:mt-3', className)} {...props} />
    ),
    a: ({ className, ...props }) => (
      <a
        className={cn('text-primary font-medium underline underline-offset-4', className)}
        {...props}
      />
    ),

    // Make our custom components available for use in MDX files
    Icon: (props: { name: IconName; className?: string }) => <Icon {...props} />,
    Alert: Alert,
    Keybind: Keybind,

    ...components
  };
}
