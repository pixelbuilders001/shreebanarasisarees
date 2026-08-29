import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/checkout',
        '/account',
        '/account/*',
        '/wishlist',
        '/payment',
        '/receipt',
        '/receipt/*',
        '/review'
      ],
    },
    sitemap: 'https://shreebanarasisarees.in/sitemap.xml',
  };
}

