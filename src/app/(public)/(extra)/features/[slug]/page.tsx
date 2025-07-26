import React from 'react';
import { notFound } from 'next/navigation';
import { featuresList } from '@/lib/data/features-list';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, LucideProps } from 'lucide-react';

const FeatureDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug;
  const feature = featuresList.find((f) => f.slug === slug);

  if (!feature) {
    notFound();
  }

  const Icon = feature.icon as React.ElementType<LucideProps>;

  return (
    <div className='bg-muted/30 min-h-screen py-24 sm:py-32'>
      <div className='container mx-auto max-w-4xl px-4'>
        <header className='mb-12 text-center'>
          <div className='bg-primary/10 text-primary mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl'>
            <Icon className='h-8 w-8' />
          </div>
          <h1 className='text-foreground mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl'>
            {feature.title}
          </h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl'>
            {feature.description}
          </p>
        </header>

        <article className='prose prose-slate dark:prose-invert lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-li:my-1 mx-auto max-w-full'>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{feature.longDescription}</ReactMarkdown>
        </article>

        <div className='mt-16 border-t pt-12 text-center'>
          <h3 className='text-2xl font-bold'>Ready to Get Started?</h3>
          <p className='text-muted-foreground mx-auto mt-2 max-w-lg'>
            Take control of your finances today with Expense Pro. It’s free to sign up.
          </p>
          <div className='mt-8'>
            <Button asChild size='lg' variant='cta' className='group'>
              <Link href='/auth/signup'>
                Sign Up Now
                <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureDetailPage;
