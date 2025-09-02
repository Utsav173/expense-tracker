import type { MDXComponents } from 'mdx/types';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Alert as UiAlert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { IconName } from '@/components/ui/icon-map';
import React from 'react';
import Link from 'next/link';

type AlertVariant = 'default' | 'destructive' | 'success' | 'tip';

const Alert = ({
  title,
  children,
  variant = 'default'
}: {
  title?: string;
  children: React.ReactNode;
  variant?: AlertVariant;
}) => {
  const iconMap: Record<AlertVariant, IconName> = {
    default: 'info',
    destructive: 'alertTriangle',
    success: 'checkCircle',
    tip: 'lightbulb'
  };

  const variantClasses: Record<AlertVariant, string> = {
    default: 'border-primary/20 bg-primary/5 text-primary [&>svg]:text-primary',
    destructive: 'border-destructive/20 bg-destructive/5 text-destructive [&>svg]:text-destructive',
    success:
      'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-300 [&>svg]:text-green-600',
    tip: 'border-orange-500/20 bg-orange-500/5 text-orange-700 dark:text-orange-300 [&>svg]:text-orange-600'
  };

  return (
    <UiAlert
      className={cn(
        'my-4 rounded-lg px-3 py-2 text-sm transition-all duration-200',
        'sm:my-6 sm:px-4 sm:py-3 sm:text-base',
        variantClasses[variant]
      )}
      role='alert'
      aria-live='polite'
    >
      <Icon name={iconMap[variant]} className='h-4 w-4 sm:h-5 sm:w-5' />
      {title && <AlertTitle className='font-semibold'>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </UiAlert>
  );
};

const Keybind = ({ children }: { children: React.ReactNode }) => (
  <kbd
    className='bg-muted text-muted-foreground border-border inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium shadow-sm transition-all duration-150 sm:h-7 sm:px-2 sm:text-sm'
    aria-label={typeof children === 'string' ? `Keyboard shortcut: ${children}` : undefined}
  >
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
    className='not-prose group bg-card text-card-foreground focus:ring-ring my-4 block rounded-xl border shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:outline-none sm:my-6'
  >
    <div className='p-4 sm:p-6'>
      <div className='flex items-start gap-3 sm:gap-4'>
        <div className='bg-primary/10 group-hover:bg-primary/15 rounded-full p-2 transition-all duration-300 sm:p-3'>
          <Icon
            name={icon}
            className='text-primary h-5 w-5 transition-transform duration-300 group-hover:scale-105 sm:h-6 sm:w-6'
          />
        </div>
        <div className='min-w-0 flex-1'>
          <h4 className='group-hover:text-primary mb-1 text-base font-semibold transition-colors duration-300 sm:text-lg'>
            {title}
          </h4>
          <p className='text-muted-foreground text-sm leading-relaxed sm:text-base'>{children}</p>
        </div>
        <Icon
          name='arrowRight'
          className='text-muted-foreground group-hover:text-primary h-4 w-4 self-center transition-all duration-300 group-hover:translate-x-0.5 sm:h-5 sm:w-5'
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
    <div className='bg-primary text-primary-foreground flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 sm:h-8 sm:w-8 sm:text-base'>
      {number}
    </div>
    <div className='min-w-0 flex-1'>
      <h4 className='mb-1 text-base font-semibold sm:mb-2 sm:text-lg'>{title}</h4>
      <div className='text-muted-foreground text-sm leading-relaxed sm:text-base'>{children}</div>
    </div>
  </div>
);

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, ...props }) => (
      <h1
        className={cn(
          'mb-4 inline-flex scroll-m-20 items-center gap-2 text-2xl font-bold tracking-tight',
          'sm:mb-6 sm:text-3xl md:text-4xl [&>span]:contents',
          className
        )}
        {...props}
      />
    ),
    h2: ({ className, children, ...props }) => {
      const childArray = React.Children.toArray(children);
      const iconMatch = childArray.find(
        (child) => React.isValidElement(child) && (child.props as any)?.mdxType === 'Icon'
      );
      const textChildren = childArray.filter(
        (child) => !(React.isValidElement(child) && (child.props as any)?.mdxType === 'Icon')
      );
      return (
        <h2
          className={cn(
            'mt-8 mb-4 inline-flex scroll-m-20 items-center gap-2 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0',
            'sm:mt-10 sm:mb-6 sm:gap-3 sm:pb-3 sm:text-2xl [&>span]:contents',
            className
          )}
          {...props}
        >
          {iconMatch}
          <span>{textChildren}</span>
        </h2>
      );
    },

    a: ({ className, ...props }) => (
      <a
        className={cn(
          'text-primary font-medium underline underline-offset-2 hover:underline-offset-4',
          'focus:ring-ring transition-all duration-200 focus:ring-2 focus:ring-offset-1 focus:outline-none',
          'sm:underline-offset-4',
          className
        )}
        {...props}
      />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          'border-primary bg-muted/50 my-4 border-l-4 py-2 pl-4 text-sm italic',
          'rounded sm:my-6 sm:py-3 sm:pl-6 sm:text-base',
          className
        )}
        {...props}
      />
    ),
    code: ({ className, ...props }) => (
      <code
        className={cn(
          'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm',
          className
        )}
        {...props}
      />
    ),
    pre: ({ className, ...props }) => (
      <pre
        className={cn(
          'bg-muted my-4 overflow-x-auto rounded-lg p-4 text-sm',
          'sm:my-6 sm:p-6 sm:text-base',
          className
        )}
        {...props}
      />
    ),
    hr: ({ className, ...props }) => (
      <hr className={cn('border-border my-6 sm:my-8', className)} {...props} />
    ),
    Icon: (props: { name: IconName; className?: string }) => <Icon {...props} />,
    Alert,
    Keybind,
    FeatureLink,
    Step,
    ...components
  };
}
