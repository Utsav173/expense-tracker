import type { Metadata } from 'next';
import { features } from '@/lib/data/features';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const feature = features.find((f) => f.slug === params.slug);

  if (!feature) {
    return {};
  }

  return {
    title: `${feature.title} - Expense Pro Features`,
    description: feature.shortDescription,
  };
}
