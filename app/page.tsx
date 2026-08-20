import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Product, Category, Review } from '@/lib/types';
import { ProductCard } from '@/components/shared/product-card';
import { RatingStars } from '@/components/shared/rating-stars';
import { AiAssistant } from '@/components/shared/ai-assistant';
import { formatPKR } from '@/lib/format';

async function getHomeData() {
  const [featured, newArrivals, bestsellers, onSale, categories, reviews] = await Promise.all([
    supabase.from('products').select('*, brand:brands(*), category:categories(*), product_images(*)').eq('is_published', true).eq('is_featured', true).limit(8),
    supabase.from('products').select('*, brand:brands(*), category:categories(*), product_images(*)').eq('is_published', true).eq('is_new', true).limit(4),
    supabase.from('products').select('*, brand:brands(*), category:categories(*), product_images(*)').eq('is_published', true).eq('is_bestseller', true).limit(4),
    supabase.from('products').select('*, brand:brands(*), category:categories(*), product_images(*)').eq('is_published', true).not('sale_price', 'is', null).limit(4),
    supabase.from('categories').select('*').is('parent_id', null).eq('is_active', true).order('sort_order'),
    supabase.from('reviews').select('*, profiles!reviews_user_id_fkey(*)').eq('is_approved', true).order('created_at', { ascending: false }).limit(3),
  ]);
  return {
    featured: featured.data as Product[] ?? [],
    newArrivals: newArrivals.data as Product[] ?? [],
    bestsellers: bestsellers.data as Product[] ?? [],
    onSale: onSale.data as Product[] ?? [],
    categories: categories.data as Category[] ?? [],
    reviews: reviews.data as Review[] ?? [],
  };
}

export default async function Home() {
  const data = await getHomeData();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container-ec grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-slide-up">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">New season collection</span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Style for every moment, delivered across Pakistan.
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Discover fashion, electronics, home and beauty. Cash on delivery, easy returns, and fast shipping nationwide.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/shop">Shop Now <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/categories/fashion">Explore Fashion</Link></Button>
            </div>
          </div>
          <div className="relative hidden aspect-square md:block">
            <div className="absolute inset-0 overflow-hidden rounded-2xl bg-muted">
              <Image src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900" alt="Shopping" fill className="object-cover" priority sizes="50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b">
        <div className="container-ec grid grid-cols-2 gap-4 py-8 md:grid-cols-4">
          {[
            { icon: Truck, title: 'Fast Delivery', desc: '2-7 days nationwide' },
            { icon: ShieldCheck, title: 'Secure Payments', desc: 'COD & bank transfer' },
            { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
            { icon: Headphones, title: '24/7 Support', desc: 'We are here to help' },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured categories */}
      {data.categories.length > 0 && (
        <section className="container-ec py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">Shop by Category</h2>
              <p className="text-sm text-muted-foreground">Find what you need across our departments</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.categories.map((c) => (
              <Link key={c.id} href={`/categories/${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                {c.image_url && <Image src={c.image_url} alt={c.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 text-lg font-semibold text-white">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {data.featured.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container-ec">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <Link href="/shop" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {data.featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      {data.newArrivals.length > 0 && (
        <section className="container-ec py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">New Arrivals</h2>
            <Link href="/shop" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Promotional banner */}
      <section className="container-ec py-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground md:p-12">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl font-bold">Mega Sale — up to 40% off</h2>
            <p className="mt-2 text-primary-foreground/80">Limited time deals across electronics, fashion and home. Use code WELCOME10 for an extra 10% off.</p>
            <Button asChild className="mt-4" variant="secondary"><Link href="/shop">Shop the Sale</Link></Button>
          </div>
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
        </div>
      </section>

      {/* Best sellers */}
      {data.bestsellers.length > 0 && (
        <section className="container-ec py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Best Sellers</h2>
            <Link href="/shop" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* On sale */}
      {data.onSale.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container-ec">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-bold">On Sale</h2>
              <Link href="/shop" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {data.onSale.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Customer reviews */}
      {data.reviews.length > 0 && (
        <section className="container-ec py-12">
          <h2 className="mb-6 text-2xl font-bold">What Our Customers Say</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {data.reviews.map((r) => (
              <div key={r.id} className="rounded-lg border bg-card p-5">
                <RatingStars value={r.rating} />
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{r.body ?? r.title}</p>
                <p className="mt-3 text-sm font-medium">{r.profiles?.full_name ?? 'Verified Customer'}</p>
                {r.is_verified_purchase && <p className="text-xs text-success">Verified Purchase</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <AiAssistant />
    </>
  );
}
