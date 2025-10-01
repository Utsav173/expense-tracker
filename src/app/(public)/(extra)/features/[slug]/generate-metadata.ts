import type { Metadata } from 'next';
import { featuresList } from '@/lib/data/features-list';

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const feature = featuresList.find((f) => f.slug === params.slug);

  if (!feature) {
    return {
      title: 'Feature Not Found'
    };
  }

  const pageTitle = `${feature.title} - Expense Pro Feature`;
  const canonicalUrl = `https://expense-pro.khatriutsav.com/features/${feature.slug}`;

  // Construct the URL to our new OG image API route
  const imageUrl = new URL('https://expense-pro.khatriutsav.com/api/og');
  imageUrl.searchParams.set('slug', feature.slug);

  return {
    title: pageTitle,
    description: feature.description,
    keywords: [feature.title.toLowerCase(), 'expense tracker feature', 'financial tool'],

    openGraph: {
      title: pageTitle,
      description: feature.description,
      url: canonicalUrl,
      type: 'article',
      // Explicitly provide the generated image URL
      images: [
        {
          url: imageUrl.toString(),
          width: 1200,
          height: 630,
          alt: pageTitle
        }
      ]
    },

    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: feature.description,
      // Explicitly provide the generated image URL for Twitter
      images: [imageUrl.toString()]
    },

    alternates: {
      canonical: canonicalUrl
    }
  };
}
