import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://souk.example';
  const staticRoutes = ['', '/shop', '/cart', '/wishlist', '/auth/login', '/auth/register'].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));

  const { data: products } = await supabase.from('products').select('slug, updated_at').eq('is_published', true);
  const productRoutes = (products ?? []).map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: new Date(p.updated_at) }));

  const { data: categories } = await supabase.from('categories').select('slug, updated_at').eq('is_active', true);
  const categoryRoutes = (categories ?? []).map((c) => ({ url: `${base}/categories/${c.slug}`, lastModified: new Date(c.updated_at) }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
