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

  return {
    title: `${feature.title} - Expense Pro`,
    description: feature.description,
    openGraph: {
      title: `${feature.title} - Expense Pro`,
      description: feature.description,
      type: 'article'
    },
    alternates: {
      canonical: `https://expense-pro.khatriutsav.com/features/${feature.slug}`,
    },
  };
}
