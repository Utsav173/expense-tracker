import React from 'react';
import { notFound } from 'next/navigation';
import { featuresList } from '@/lib/data/features-list';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { IconName } from '@/components/ui/icon-map';
import { Metadata } from 'next';
import { Graph } from 'schema-dts';
import Script from 'next/script';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const feature = featuresList.find((f) => f.slug === slug);

  if (!feature) {
    return {};
  }

  return {
    title: `${feature.title} - Expense Tracker Feature`,
    description: feature.description,
    keywords: [`${feature.title.toLowerCase()}`, 'expense tracker feature', 'financial tool'],
    openGraph: {
      title: `${feature.title} - Expense Tracker Feature`,
      description: feature.description,
      url: `https://expense-pro.khatriutsav.com/features/${feature.slug}`,
      type: 'article',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image.png',
          width: 1200,
          height: 630,
          alt: `${feature.title} Feature`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${feature.title} - Expense Tracker Feature`,
      description: feature.description,
      images: ['https://expense-pro.khatriutsav.com/og-image.png']
    }
  };
}

const FeatureDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug;
  const feature = featuresList.find((f) => f.slug === slug);

  if (!feature) {
    notFound();
  }

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${feature.title} Feature - Expense Tracker`,
        url: `https://expense-pro.khatriutsav.com/features/${feature.slug}`,
        description: feature.description,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://expense-pro.khatriutsav.com'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Features',
              item: 'https://expense-pro.khatriutsav.com/features'
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: feature.title,
              item: `https://expense-pro.khatriutsav.com/features/${feature.slug}`
            }
          ]
        }
      },
      {
        '@type': 'TechArticle',
        headline: feature.title,
        description: feature.description,
        image: 'https://expense-pro.khatriutsav.com/og-image.png',
        datePublished: '2023-01-01', // Placeholder, ideally from feature data
        author: {
          '@type': 'Organization',
          name: 'Expense Tracker'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Expense Tracker',
          logo: {
            '@type': 'ImageObject',
            url: 'https://expense-pro.khatriutsav.com/favicon-96x96.png'
          }
        },
        articleBody: feature.longDescription
      }
    ]
  } as any;

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className='bg-muted/30 min-h-screen py-16 md:py-24 lg:py-32'>
        <div className='container mx-auto max-w-4xl px-4'>
          <header className='mb-12 text-center'>
            <div className='bg-primary/10 text-primary mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg'>
              <Icon name={feature.icon as IconName} className='h-8 w-8' />
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
        </div>
      </div>
    </>
  );
};

export default FeatureDetailPage;
