'use client';

import React, { Suspense, useMemo, lazy } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
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
                    isMobile ? 'h-[90dvh] w-full rounded-t-xl' : 'h-full max-w-2xl min-w-[30%]'
                )}
                aria-describedby={undefined}
            >
                <SheetHeader>
                    <SheetTitle className='flex items-center gap-2'>
                        <Icon name='lifeBuoy' className='text-primary h-5 w-5' />
                        {title}
                    </SheetTitle>
                    <SheetDescription>
                        Quick guide for the current page. For more, visit the full Help Center.
                    </SheetDescription>
                </SheetHeader>
                <div className='-mx-6 flex-1 overflow-y-auto px-6'>
                    <article className='prose prose-slate dark:prose-invert max-w-full py-4'>
                        <Suspense fallback={<Loader />}>
                            <MdxComponent />
                        </Suspense>
                    </article>
                </div>
                <SheetFooter className='mt-auto border-t pt-4'>
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
