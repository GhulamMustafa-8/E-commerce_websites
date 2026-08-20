import { supabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/shop/breadcrumb';
import { ProductCard } from '@/components/shared/product-card';
import type { Product, Category } from '@/lib/types';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.from('categories').select('name, seo_title, seo_description, description').eq('slug', slug).maybeSingle();
  if (!data) return { title: 'Category not found' };
  return { title: data.seo_title ?? data.name, description: data.seo_description ?? data.description ?? '' };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const { data: category } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
  if (!category) notFound();

  const { data: children } = await supabase.from('categories').select('id').eq('parent_id', category.id);
  const categoryIds = [category.id, ...(children ?? []).map((c) => c.id)];

  const { data: products } = await supabase
    .from('products')
    .select('*, brand:brands(*), category:categories(*), product_images(*)')
    .eq('is_published', true)
    .in('category_id', categoryIds)
    .order('created_at', { ascending: false })
    .limit(24);

  return (
    <div className="container-ec py-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: category.name }]} />
      <h1 className="mt-4 text-2xl font-bold">{category.name}</h1>
      {category.description && <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(products as Product[] ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {(!products || products.length === 0) && (
        <p className="py-12 text-center text-sm text-muted-foreground">No products in this category yet.</p>
      )}
    </div>
  );
}
