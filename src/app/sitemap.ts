import { MetadataRoute } from 'next';
import { supabase, fetchCategories, fetchProducts, fetchActiveCampaigns } from '../data/supabase';
import { BLOG_POSTS } from '../data/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shreebanarasisarees.in';

  const [products, categories, campaigns, collectionsRes] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchActiveCampaigns(),
    supabase.from('collections').select('id, name, slug, updated_at').eq('is_active', true)
  ]);

  // 1. Static Pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sarees`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/our-store`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.75,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/returns-refunds`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cancellation-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/payment-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/grievance-redressal`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // 2. Saree Categories & Occasions
  const subCategories = [
    'banarasi',
    'chikankari',
    'bandhani',
    'organza',
    'chanderi',
    'bridal',
    'wedding',
    'party-wear',
    'offers',
    ...categories.map(c => c.slug.toLowerCase())
  ];
  const uniqueSubCategories = Array.from(new Set(subCategories));

  const categoryPages = uniqueSubCategories.map((cat) => ({
    url: `${baseUrl}/sarees/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // 3. Curated Collections & Campaign Pages
  const collectionSlugMap = new Map<string, Date>();

  (campaigns || []).forEach((c) => {
    if (c.slug) {
      collectionSlugMap.set(c.slug.toLowerCase().trim(), c.updated_at ? new Date(c.updated_at) : new Date());
    }
  });

  const dynamicCollections = (collectionsRes?.data as any[]) || [];
  dynamicCollections.forEach((col) => {
    const slug = col.slug || col.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (slug) {
      const clean = slug.toLowerCase().trim();
      if (!collectionSlugMap.has(clean)) {
        collectionSlugMap.set(clean, col.updated_at ? new Date(col.updated_at) : new Date());
      }
    }
  });

  const collectionPages = Array.from(collectionSlugMap.entries()).map(([slug, lastModified]) => ({
    url: `${baseUrl}/collections/${slug}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // 4. Product Pages
  const productPages = products.map((prod) => ({
    url: `${baseUrl}/product/${prod.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 5. Blog Post Pages
  const blogPages = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));

  return [...staticPages, ...categoryPages, ...collectionPages, ...productPages, ...blogPages];
}

