import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/cart',
        '/cart/*',
        '/checkout',
        '/checkout/*',
        '/account',
        '/account/*',
        '/orders',
        '/orders/*',
        '/wishlist',
        '/payment',
        '/payment/*',
        '/receipt',
        '/receipt/*',
        '/review',
        '/review/*',
        '/offline',
        '/api/*',
      ],
    },
    sitemap: 'https://shreebanarasisarees.in/sitemap.xml',
  };
}

