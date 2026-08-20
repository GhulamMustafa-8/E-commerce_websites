'use client';

import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/lib/context/wishlist-context';
import { useAuth } from '@/lib/context/auth-context';
import { ProductCard } from '@/components/shared/product-card';

export default function WishlistPage() {
  const { items } = useWishlist();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container-ec py-12">
        <div className="mx-auto max-w-md rounded-lg border p-8 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-bold">Please sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to view and manage your wishlist.</p>
          <Button asChild className="mt-4"><Link href="/auth/login">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-ec py-6">
      <h1 className="text-2xl font-bold">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Your wishlist is empty</h3>
          <p className="text-sm text-muted-foreground">Tap the heart on any product to save it here.</p>
          <Button asChild variant="outline"><Link href="/shop"><ShoppingBag className="mr-2 h-4 w-4" /> Browse Products</Link></Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => item.product && <ProductCard key={item.id} product={item.product} />)}
        </div>
      )}
    </div>
  );
}
