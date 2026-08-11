import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/account'],
    },
    sitemap: 'https://shreebanarasisarees.com/sitemap.xml',
  };
}
