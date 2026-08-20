import { supabase } from '@/lib/supabase/client';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/shared/product-card';
import { Pagination } from '@/components/shop/pagination';
import { EmptyState } from '@/components/shop/empty-state';
import { SkeletonGrid } from '@/components/shop/skeleton-grid';

const PER_PAGE = 12;

export async function ProductGrid({
  page,
  category,
  brand,
  minPrice,
  maxPrice,
  sort,
  q,
}: {
  page: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
  q?: string;
}) {
  let query = supabase
    .from('products')
    .select('*, brand:brands(*), category:categories(*), product_images(*)', { count: 'exact' })
    .eq('is_published', true);

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).maybeSingle();
    if (cat) query = query.eq('category_id', cat.id);
  }
  if (brand) {
    const { data: b } = await supabase.from('brands').select('id').eq('slug', brand).maybeSingle();
    if (b) query = query.eq('brand_id', b.id);
  }
  if (minPrice !== undefined) query = query.gte('price', minPrice);
  if (maxPrice !== undefined) query = query.lte('price', maxPrice);
  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,short_description.ilike.%${q}%`);
  }

  switch (sort) {
    case 'newest': query = query.order('created_at', { ascending: false }); break;
    case 'price_asc': query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'rating': query = query.order('rating_avg', { ascending: false }); break;
    case 'bestselling': query = query.order('is_bestseller', { ascending: false }).order('rating_count', { ascending: false }); break;
    default: query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }

  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;
  query = query.range(from, to);

  const { data, count } = await query;
  const products = (data as Product[]) ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} product{total !== 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} />}
    </div>
  );
}
