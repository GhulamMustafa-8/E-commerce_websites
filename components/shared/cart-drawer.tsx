'use client';

import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/context/cart-context';
import { formatPKR } from '@/lib/format';
import Image from 'next/image';

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { lines, subtotal, loading, removeItem, count } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Your Cart ({count})
          </SheetTitle>
          <SheetDescription className="sr-only">Review the items in your shopping cart</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">Loading cart…</div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Button asChild onClick={() => onOpenChange(false)}>
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-3 p-4">
                {lines.map((line) => (
                  <div key={line.id} className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {line.product?.product_images?.[0]?.url && (
                        <Image src={line.product.product_images[0].url} alt={line.product.name} fill className="object-cover" sizes="80px" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <Link href={`/products/${line.product?.slug}`} className="line-clamp-2 text-sm font-medium hover:underline" onClick={() => onOpenChange(false)}>
                        {line.product?.name}
                      </Link>
                      {line.variant && (
                        <p className="text-xs text-muted-foreground">
                          {line.variant.size ? `Size: ${line.variant.size}` : ''} {line.variant.color ? `${line.variant.size ? '· ' : ''}Color: ${line.variant.color}` : ''}
                        </p>
                      )}
                      <p className="text-sm font-semibold">{formatPKR(line.unitPrice)}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Qty {line.quantity}</span>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => removeItem(line.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPKR(subtotal)}</span>
              </div>
              <Separator className="my-3" />
              <Button asChild className="w-full" size="lg" onClick={() => onOpenChange(false)}>
                <Link href="/cart">View Cart <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full" onClick={() => onOpenChange(false)}>
                <Link href="/checkout">Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
