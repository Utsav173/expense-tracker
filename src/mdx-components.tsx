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
      className={cn('rounded-lg pb-0', variantClasses[variant], {
        'py-0': !title
      })}
      role='alert'
      aria-live='polite'
    >
      {title && (
        <AlertTitle className='flex items-center gap-2 font-semibold'>
          <Icon name={iconMap[variant]} className='h-4 w-4' aria-hidden='true' /> {title}
        </AlertTitle>
      )}
      <AlertDescription>{children}</AlertDescription>
    </UiAlert>
  );
};

const Keybind = ({ children }: { children: React.ReactNode }) => (
  <kbd
    className='bg-muted text-muted-foreground border-border inline-flex items-center justify-center rounded-md border px-2 py-1 font-mono text-sm font-medium shadow-sm'
    aria-label={typeof children === 'string' ? `Keyboard shortcut: ${children}` : undefined}
  >
    {children}
  </kbd>
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
  <section className='my-8' aria-labelledby={`step-${number}-title`}>
    <div
      id={`step-${number}-title`}
      className='flex items-center justify-start gap-2.5 text-lg font-semibold'
    >
      <span className='bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
        {number}
      </span>
      {title}
    </div>
    <div className='text-muted-foreground mt-2 mb-2 ml-3 border-l-2 pl-6'>{children}</div>
  </section>
);

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Icon: (props: { name: IconName; className?: string }) => <Icon {...props} />,
    Alert,
    Keybind,
    Step,
    ...components
  };
}
