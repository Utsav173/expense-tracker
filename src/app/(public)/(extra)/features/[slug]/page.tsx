import React from 'react';
import { notFound } from 'next/navigation';
import { features } from '@/lib/data/features';

const FeaturePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug;

  const feature = features.find((f) => f.slug === slug);

  if (!feature) {
    notFound();
  }

  return (
    <div className='bg-background min-h-screen px-4 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <h1 className='text-foreground mb-4 text-center text-4xl font-bold md:text-5xl'>
          {feature.title}
        </h1>
        <p className='text-muted-foreground mx-auto mb-12 max-w-2xl text-center text-xl'>
          {feature.shortDescription}
        </p>
        <article className='prose prose-slate dark:prose-invert lg:prose-lg mx-auto'>
          {/* Render longDescription as raw HTML/Markdown if it contains formatting */}
          <div dangerouslySetInnerHTML={{ __html: feature.longDescription }} />
        </article>
      </div>
    </div>
  );
};

export default FeaturePage;
