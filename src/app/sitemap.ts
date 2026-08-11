import { MetadataRoute } from 'next';
import { PRODUCTS } from '../data/products';
import { BLOG_POSTS } from '../data/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://shreebanarasisarees.com';

  // 1. Static Pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sarees`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
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
    'offers'
  ];

  const categoryPages = subCategories.map((cat) => ({
    url: `${baseUrl}/sarees/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // 3. Product Pages
  const productPages = PRODUCTS.map((prod) => ({
    url: `${baseUrl}/product/${prod.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 4. Blog Post Pages
  const blogPages = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
}
