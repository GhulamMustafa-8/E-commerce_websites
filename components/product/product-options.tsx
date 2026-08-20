'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Heart, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useCart } from '@/lib/context/cart-context';
import { useWishlist } from '@/lib/context/wishlist-context';
import { useAuth } from '@/lib/context/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant } from '@/lib/types';

export function ProductOptions({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const [variantId, setVariantId] = useState<string | null>(product.product_variants?.[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const variants = product.product_variants ?? [];
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const inWishlist = has(product.id);
  const stock = product.inventory?.[0]?.stock_quantity ?? 0;

  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];

  async function handleAdd() {
    if (!user) {
      toast.error('Please sign in to add items to your cart.');
      router.push('/auth/login');
      return;
    }
    if (quantity > stock) {
      toast.error('Not enough stock available.');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product, variant, quantity);
      toast.success('Added to cart!');
    } catch {
      toast.error('Could not add to cart.');
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    await addToCart(product, variant, quantity);
    router.push('/checkout');
  }

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <div>
          <Label className="text-sm font-semibold">Size</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  const v = variants.find((x) => x.size === s);
                  if (v) setVariantId(v.id);
                }}
                className={cn('min-w-10 rounded-md border px-3 py-2 text-sm', variants.find((v) => v.id === variantId)?.size === s ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-accent')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <Label className="text-sm font-semibold">Color</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.filter((v) => v.color).map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                title={v.color ?? ''}
                className={cn('h-8 w-8 rounded-full border-2', variantId === v.id ? 'border-primary ring-2 ring-primary/30' : 'border-border')}
                style={{ backgroundColor: v.color_hex ?? '#ccc' }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <Label className="text-sm font-semibold">Quantity</Label>
        <div className="mt-2 inline-flex items-center rounded-md border">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="h-4 w-4" /></Button>
          <span className="w-12 text-center text-sm font-medium">{quantity}</span>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity((q) => Math.min(stock, q + 1))} aria-label="Increase quantity"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleAdd} disabled={adding || stock === 0} className="flex-1" size="lg">
          <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
        <Button onClick={handleBuyNow} disabled={stock === 0} variant="secondary" className="flex-1" size="lg">Buy Now</Button>
        <Button onClick={() => { if (!user) { toast.error('Please sign in.'); return; } toggle(product); }} variant="outline" size="icon" className="h-11 w-11" aria-label="Wishlist">
          <Heart className={cn('h-5 w-5', inWishlist && 'fill-destructive text-destructive')} />
        </Button>
      </div>
    </div>
  );
}
