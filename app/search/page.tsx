import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { ProductCard } from '@/components/shared/product-card';
import { SearchX } from 'lucide-react';
import type { Product } from '@/lib/types';

export const metadata = { title: 'Search' };

export default async function SearchPage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';

  let products: Product[] = [];
  if (q) {
    const { data } = await supabase
      .from('products')
      .select('*, brand:brands(*), category:categories(*), product_images(*)')
      .eq('is_published', true)
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(24);
    products = (data as Product[]) ?? [];
  }

  return (
    <div className="container-ec py-6">
      <h1 className="text-2xl font-bold">Search Results</h1>
      {q ? <p className="mt-1 text-sm text-muted-foreground">Showing results for &ldquo;{q}&rdquo;</p> : <p className="mt-1 text-sm text-muted-foreground">Type something in the search bar above.</p>}

      {q && products.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No results found</h3>
          <p className="text-sm text-muted-foreground">Try different keywords or browse all products.</p>
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">Browse all products</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
