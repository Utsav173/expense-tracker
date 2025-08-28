import type { MDXComponents } from 'mdx/types';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Alert as UiAlert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { IconName } from './components/ui/icon-map';
import React from 'react';
import Link from 'next/link';

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
    <UiAlert
      className={cn(
        'my-4 px-3 py-2 text-sm sm:my-6 sm:px-4 sm:py-3 sm:text-base',
        variantClasses[variant]
      )}
    >
      <Icon name={iconMap[variant]} className='h-4 w-4 sm:h-5 sm:w-5' />
      {title && <AlertTitle className='font-bold'>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </UiAlert>
  );
};

const Keybind = ({ children }: { children: React.ReactNode }) => (
  <kbd className='text-muted-foreground bg-muted border-border rounded-md border px-2 py-1 text-xs font-semibold shadow-sm sm:px-2.5 sm:py-1.5 sm:text-sm'>
    {children}
  </kbd>
);

const FeatureLink = ({
  href,
  title,
  icon,
  children
}: {
  href: string;
  title: string;
  icon: IconName;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className='not-prose bg-card text-card-foreground my-4 block rounded-xl border shadow-sm transition-all hover:shadow-md sm:my-6'
  >
    <div className='p-4 sm:p-6'>
      <div className='flex items-start gap-3 sm:gap-4'>
        <div className='bg-primary/10 text-primary rounded-full p-2 sm:p-3'>
          <Icon name={icon} className='h-5 w-5 sm:h-6 sm:w-6' />
        </div>
        <div className='flex-1'>
          <h4 className='text-base font-semibold sm:text-lg'>{title}</h4>
          <p className='text-muted-foreground mt-1 text-sm sm:text-base'>{children}</p>
        </div>
        <Icon
          name='arrowRight'
          className='text-muted-foreground h-4 w-4 self-center sm:h-5 sm:w-5'
        />
      </div>
    </div>
  </Link>
);

const Step = ({
  number,
  title,
  children
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) => (
  <div className='step my-6 flex items-start gap-3 sm:my-8 sm:gap-4'>
    <div className='bg-primary text-primary-foreground flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold sm:h-8 sm:w-8 sm:text-base'>
      {number}
    </div>
    <div className='flex-1'>
      <h4 className='text-base font-semibold sm:text-lg'>{title}</h4>
      <div className='text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base'>{children}</div>
    </div>
  </div>
);

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
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
            'mt-4 flex items-center gap-2 border-b pb-2 text-2xl font-bold tracking-tight first:mt-0 sm:mt-8 sm:gap-3 sm:pb-3 sm:text-3xl [&>span]:contents',
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
      <h3
        className={cn('mt-6 text-xl font-semibold tracking-tight sm:mt-8 sm:text-2xl', className)}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={cn(
          'text-sm leading-6 sm:text-base sm:leading-7 [&:not(:first-child)]:mt-3 sm:[&:not(:first-child)]:mt-4',
          className
        )}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul
        className={cn('my-4 ml-5 list-disc sm:my-6 sm:ml-6 [&>li]:mt-2 sm:[&>li]:mt-3', className)}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={cn(
          'my-4 ml-5 list-decimal sm:my-6 sm:ml-6 [&>li]:mt-2 sm:[&>li]:mt-3',
          className
        )}
        {...props}
      />
    ),
    a: ({ className, ...props }) => (
      <a
        className={cn(
          'text-primary font-medium underline underline-offset-2 sm:underline-offset-4',
          className
        )}
        {...props}
      />
    ),

    Icon: (props: { name: IconName; className?: string }) => <Icon {...props} />,
    Alert: Alert,
    Keybind: Keybind,
    FeatureLink: FeatureLink,
    Step: Step,

    ...components
  };
}
