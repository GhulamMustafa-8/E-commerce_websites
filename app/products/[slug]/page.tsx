import { supabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumb } from '@/components/shop/breadcrumb';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductOptions } from '@/components/product/product-options';
import { ReviewSection } from '@/components/product/review-section';
import { ProductCard } from '@/components/shared/product-card';
import { RatingStars } from '@/components/shared/rating-stars';
import { formatPKR, discountPercent, effectivePrice } from '@/lib/format';
import { Truck, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import type { Product } from '@/lib/types';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.from('products').select('name, short_description, seo_title, seo_description').eq('slug', slug).maybeSingle();
  if (!data) return { title: 'Product not found' };
  return {
    title: data.seo_title ?? data.name,
    description: data.seo_description ?? data.short_description ?? '',
    openGraph: { title: data.name, description: data.seo_description ?? data.short_description ?? '' },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const { data: product } = await supabase
    .from('products')
    .select('*, brand:brands(*), category:categories(*), product_images(*), product_variants(*), inventory(*)')
    .eq('slug', slug)
    .maybeSingle();

  if (!product) notFound();
  const p = product as Product;

  const { data: related } = await supabase
    .from('products')
    .select('*, brand:brands(*), category:categories(*), product_images(*)')
    .eq('is_published', true)
    .eq('category_id', p.category_id ?? '')
    .neq('id', p.id)
    .limit(4);

  const price = effectivePrice(p.price, p.sale_price);
  const pct = discountPercent(p.price, p.sale_price);
  const stock = p.inventory?.[0]?.stock_quantity ?? 0;
  const inStock = stock > 0;
  const features = p.features ? p.features.split(';').filter(Boolean) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.short_description ?? '',
    sku: p.sku ?? '',
    brand: { '@type': 'Brand', name: p.brand?.name ?? '' },
    offers: {
      '@type': 'Offer',
      price: String(price),
      priceCurrency: 'PKR',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: p.rating_count > 0 ? { '@type': 'AggregateRating', ratingValue: p.rating_avg, reviewCount: p.rating_count } : undefined,
  };

  return (
    <div className="container-ec py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: p.name }]} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <ProductGallery images={p.product_images ?? []} name={p.name} />
        <div>
          <p className="text-sm text-muted-foreground">{p.brand?.name}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{p.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars value={p.rating_avg} size="md" />
            <span className="text-sm text-muted-foreground">{p.rating_avg.toFixed(1)} ({p.rating_count} reviews)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPKR(price)}</span>
            {pct > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPKR(p.price)}</span>
                <span className="rounded bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">Save {pct}%</span>
              </>
            )}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">SKU: {p.sku ?? 'N/A'}</p>

          <div className="mt-2">
            {inStock ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-success"><Check className="h-4 w-4" /> In Stock ({stock} available)</span>
            ) : (
              <span className="text-sm font-medium text-destructive">Out of Stock</span>
            )}
          </div>

          {p.short_description && <p className="mt-4 text-sm text-muted-foreground">{p.short_description}</p>}

          <div className="mt-6">
            <ProductOptions product={p} />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t pt-4 text-center text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1"><Truck className="h-5 w-5 text-primary" /> Fast Delivery</div>
            <div className="flex flex-col items-center gap-1"><RotateCcw className="h-5 w-5 text-primary" /> 7-Day Returns</div>
            <div className="flex flex-col items-center gap-1"><ShieldCheck className="h-5 w-5 text-primary" /> Secure Pay</div>
          </div>
        </div>
      </div>

      {/* Description & specs */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold">Description</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
          {features.length > 0 && (
            <>
              <h3 className="mt-6 text-lg font-semibold">Features</h3>
              <ul className="mt-2 space-y-1">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
            </>
          )}
          {p.specifications && Object.keys(p.specifications).length > 0 && (
            <>
              <h3 className="mt-6 text-lg font-semibold">Specifications</h3>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {Object.entries(p.specifications).map(([k, v]) => (
                    <tr key={k} className="border-b">
                      <td className="py-2 font-medium capitalize">{k}</td>
                      <td className="py-2 text-muted-foreground">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">Shipping & Returns</h3>
          <p className="mt-2 text-sm text-muted-foreground">Free shipping on orders over PKR 5,000. Standard delivery 2-7 business days. Returns accepted within 7 days of delivery.</p>
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={p.id} ratingAvg={p.rating_avg} ratingCount={p.rating_count} />

      {/* Related */}
      {related && related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">You may also like</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((rp) => <ProductCard key={rp.id} product={rp as Product} />)}
          </div>
        </section>
      )}
    </div>
  );
}
