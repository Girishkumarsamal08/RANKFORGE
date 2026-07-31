import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/tests', '/settings', '/api'],
      },
    ],
    sitemap: 'https://rankforge-gate.vercel.app/sitemap.xml',
  };
}
