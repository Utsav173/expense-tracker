import React from 'react';
import { notFound } from 'next/navigation';
import { featuresList } from '@/lib/data/features-list';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, LucideProps } from 'lucide-react';
import { Card } from '@/components/ui/card';

const FeatureDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug;
  const feature = featuresList.find((f) => f.slug === slug);

  if (!feature) {
    notFound();
  }

  const Icon = feature.icon as React.ElementType<LucideProps>;

  return (
    <div className='bg-muted/30 min-h-screen py-16 md:py-24 lg:py-32'>
      <div className='container mx-auto max-w-4xl px-4'>
        <header className='mb-12 text-center'>
          <div className='bg-primary/10 text-primary mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg'>
            <Icon className='h-8 w-8' />
          </div>
          <h1 className='text-foreground mb-4 text-4xl font-extrabold tracking-tighter sm:text-5xl lg:text-6xl'>
            {feature.title}
          </h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl'>
            {feature.description}
          </p>
        </header>

        <Card className='p-6 shadow-xl sm:p-8 md:p-10'>
          <article className='prose prose-slate dark:prose-invert lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-li:my-2 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-md prose-code:bg-muted prose-code:text-foreground prose-code:rounded-md prose-code:px-1.5 prose-code:py-1 mx-auto max-w-full'>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{feature.longDescription}</ReactMarkdown>
          </article>
        </Card>

        <div className='mt-16 border-t pt-12 text-center md:mt-24 md:pt-16'>
          <h3 className='text-3xl font-bold'>Ready to Get Started?</h3>
          <p className='text-muted-foreground mx-auto mt-4 max-w-lg'>
            Take control of your finances today with Expense Pro. It’s free to sign up.
          </p>
          <div className='mt-8'>
            <Button asChild size='lg' className='group'>
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
