'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/context/cart-context';
import { useAuth } from '@/lib/context/auth-context';
import { formatPKR } from '@/lib/format';

export default function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem, loading } = useCart();
  const { user } = useAuth();

  if (loading) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Loading cart…</div>;

  if (!user) {
    return (
      <div className="container-ec py-12">
        <div className="mx-auto max-w-md rounded-lg border p-8 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-bold">Please sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">You need to be signed in to use the cart.</p>
          <Button asChild className="mt-4"><Link href="/auth/login">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-ec py-12">
        <div className="mx-auto max-w-md rounded-lg border p-8 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-bold">Your cart is empty</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse our products and add something you love.</p>
          <Button asChild className="mt-4"><Link href="/shop">Start Shopping</Link></Button>
        </div>
      </div>
    );
  }

  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + shipping;

  return (
    <div className="container-ec py-6">
      <h1 className="text-2xl font-bold">Shopping Cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y rounded-lg border">
            {lines.map((line) => (
              <div key={line.id} className="flex gap-4 p-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
                  {line.product?.product_images?.[0]?.url && (
                    <Image src={line.product.product_images[0].url} alt={line.product.name} fill sizes="96px" className="object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <Link href={`/products/${line.product?.slug}`} className="font-medium hover:underline">{line.product?.name}</Link>
                  {line.variant && <p className="text-xs text-muted-foreground">{line.variant.size ? `Size: ${line.variant.size}` : ''} {line.variant.color ? `· Color: ${line.variant.color}` : ''}</p>}
                  <p className="text-sm font-semibold">{formatPKR(line.unitPrice)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(line.id, line.quantity - 1)} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></Button>
                      <span className="w-10 text-center text-sm">{line.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(line.id, line.quantity + 1)} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(line.id)}><Trash2 className="mr-1 h-4 w-4" /> Remove</Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPKR(line.lineTotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-lg border p-5">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPKR(shipping)}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatPKR(total)}</span></div>
            </div>
            <Button asChild className="mt-4 w-full" size="lg"><Link href="/checkout">Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" className="mt-2 w-full"><Link href="/shop">Continue Shopping</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
