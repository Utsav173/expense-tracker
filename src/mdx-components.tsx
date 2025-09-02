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
    <UiAlert className={cn('rounded-lg', variantClasses[variant])} role='alert' aria-live='polite'>
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
    className='not-prose group bg-card focus:ring-ring my-4 block rounded-xl border p-6 shadow-sm transition-all hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:outline-none'
  >
    <div className='space-y-3'>
      <Icon
        name={icon}
        className='text-primary bg-primary/10 group-hover:bg-primary/15 inline-flex size-10 items-center justify-center rounded-full transition-colors max-md:size-6'
        aria-hidden='true'
      />
      <h3 className='group-hover:text-primary text-lg font-semibold transition-colors'>{title}</h3>
      <p className='text-muted-foreground leading-relaxed'>{children}</p>
    </div>

    <div className='mt-4 flex justify-end'>
      <Icon
        name='arrowRight'
        className='text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors'
        aria-hidden='true'
      />
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
  <section className='my-6' aria-labelledby={`step-${number}-title`}>
    <h3 id={`step-${number}-title`} className='flex items-center gap-3 text-lg font-semibold'>
      <span className='bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-bold'>
        {number}
      </span>
      {title}
    </h3>
    <div className='text-muted-foreground mt-3 ml-11 leading-relaxed'>{children}</div>
  </section>
);

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Icon: (props: { name: IconName; className?: string }) => <Icon {...props} />,
    Alert,
    Keybind,
    FeatureLink,
    Step,
    ...components
  };
}
