import { MetadataRoute } from 'next';
import { featuresList } from '@/lib/data/features-list';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://expense-pro.khatriutsav.com';

  // Feature pages
  const featureUrls = featuresList.map((feature) => ({
    url: `${baseUrl}/features/${feature.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9
  }));

  // Static pages
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/support/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/support/feedback`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/legal/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/legal/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5
    }
  ];

  // Auth pages
  const authUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/auth/forgot-password`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/auth/reset-password`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6
    }
  ];

  return [...staticUrls, ...featureUrls, ...authUrls];
}
