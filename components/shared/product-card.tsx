'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlist } from '@/lib/context/wishlist-context';
import { useAuth } from '@/lib/context/auth-context';
import { formatPKR, discountPercent, effectivePrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';

export function ProductCard({ product }: { product: Product }) {
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const inWishlist = has(product.id);
  const price = effectivePrice(product.price, product.sale_price);
  const pct = discountPercent(product.price, product.sale_price);
  const img = product.product_images?.[0]?.url;

  function onWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to use your wishlist.');
      return;
    }
    toggle(product);
  }

  return (
    <Link href={`/products/${product.slug}`} className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {img ? (
          <Image src={img} alt={product.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {pct > 0 && <Badge className="bg-destructive text-destructive-foreground">-{pct}%</Badge>}
          {product.is_new && <Badge className="bg-primary text-primary-foreground">New</Badge>}
        </div>
        <Button variant="secondary" size="icon" className="absolute right-2 top-2 h-8 w-8 rounded-full" onClick={onWishlist} aria-label="Toggle wishlist">
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-destructive text-destructive' : ''}`} />
        </Button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-muted-foreground">{product.brand?.name ?? 'Souk'}</p>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span>{product.rating_avg.toFixed(1)} ({product.rating_count})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-semibold">{formatPKR(price)}</span>
          {product.sale_price && product.sale_price < product.price && (
            <span className="text-xs text-muted-foreground line-through">{formatPKR(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
