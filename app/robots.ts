import { NextResponse } from 'next/server';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/cart'] },
    sitemap: 'https://souk.example/sitemap.xml',
  };
}
