import Link from 'next/link';
import { Suspense } from 'react';
import { SearchInput } from '@/components/shop/search-input';
import { Filters } from '@/components/shop/filters';
import { ProductGrid } from '@/components/shop/product-grid';
import { Breadcrumb } from '@/components/shop/breadcrumb';
import { supabase } from '@/lib/supabase/client';
import type { Category, Brand } from '@/lib/types';

export const metadata = { title: 'Shop All Products' };

export default async function ShopPage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const params = await searchParams;
  const page = Number(params.page ?? '1');
  const category = typeof params.category === 'string' ? params.category : undefined;
  const brand = typeof params.brand === 'string' ? params.brand : undefined;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const sort = typeof params.sort === 'string' ? params.sort : 'featured';
  const q = typeof params.q === 'string' ? params.q : undefined;

  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('brands').select('*').eq('is_active', true).order('name'),
  ]);

  return (
    <div className="container-ec py-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">All Products</h1>
        <Suspense>
          <SearchInput defaultValue={q} />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Filters categories={categories as Category[] ?? []} brands={brands as Brand[] ?? []} />
        </aside>
        <div>
          <ProductGrid page={page} category={category} brand={brand} minPrice={minPrice} maxPrice={maxPrice} sort={sort} q={q} />
        </div>
      </div>
    </div>
  );
}
