'use client';

import React, { Suspense, useMemo, lazy } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { pathMappings } from '@/content/help';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import Loader from '../ui/loader';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const getMdxComponent = (sectionId: string) => {
  return lazy(() => import(`@/content/help/${sectionId}.mdx`));
};

interface ContextualHelpSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ContextualHelpSidebar: React.FC<ContextualHelpSidebarProps> = ({
  isOpen,
  onOpenChange
}) => {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const { MdxComponent, title } = useMemo(() => {
    let sectionId = 'getting-started';
    let sectionTitle = 'Getting Started';

    const matchedMapping = pathMappings.find((mapping) => mapping.path.test(pathname));
    if (matchedMapping) {
      sectionId = matchedMapping.id;
      sectionTitle = matchedMapping.title;
    }

    return { MdxComponent: getMdxComponent(sectionId), title: sectionTitle };
  }, [pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col p-0 [&>button:first-of-type]:hidden',
          isMobile ? 'h-[90dvh] w-full rounded-t-xl' : 'h-full max-w-[55%] min-w-[40%]'
        )}
        aria-describedby={undefined}
      >
        <SheetHeader className='border-b p-6 max-sm:p-3'>
          <SheetTitle className='flex items-center gap-2'>Quick guide for {title}</SheetTitle>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto p-6'>
          <article className='prose prose-sm dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:inline-flex prose-headings:items-baseline prose-headings:gap-2 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-li:my-2 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-md prose-code:bg-muted prose-code:text-foreground prose-code:rounded-md prose-code:px-1.5 prose-code:py-1 mx-auto max-w-full'>
            <Suspense
              fallback={<Loader className='absolute inset-0 flex items-center justify-center' />}
            >
              <MdxComponent />
            </Suspense>
          </article>
        </div>
        <SheetFooter className='mt-auto border-t p-6 max-sm:p-3'>
          <Button asChild className='w-full'>
            <Link href='/help'>
              Go to Full Help Center
              <Icon name='arrowRight' className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
