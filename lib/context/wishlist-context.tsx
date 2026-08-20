'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth-context';
import type { Product, WishlistItem } from '@/lib/types';

interface WishlistContextValue {
  items: WishlistItem[];
  productIds: Set<string>;
  count: number;
  loading: boolean;
  wishlistId: string | null;
  toggle: (product: Product) => Promise<void>;
  has: (productId: string) => boolean;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  productIds: new Set(),
  count: 0,
  loading: true,
  wishlistId: null,
  toggle: async () => {},
  has: () => false,
  remove: async () => {},
  refresh: async () => {},
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setWishlistId(null);
      setLoading(false);
      return;
    }
    let { data: wl } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!wl) {
      const { data: newWl } = await supabase
        .from('wishlists')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      wl = newWl;
    }
    if (!wl) {
      setLoading(false);
      return;
    }
    setWishlistId(wl.id);
    const { data: wlItems } = await supabase
      .from('wishlist_items')
      .select('*, product:products(*)')
      .eq('wishlist_id', wl.id);
    setItems((wlItems as WishlistItem[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggle = useCallback(
    async (product: Product) => {
      if (!user || !wishlistId) return;
      const existing = items.find((i) => i.product_id === product.id);
      if (existing) {
        await supabase.from('wishlist_items').delete().eq('id', existing.id);
      } else {
        await supabase.from('wishlist_items').insert({ wishlist_id: wishlistId, product_id: product.id });
      }
      await fetchWishlist();
    },
    [user, wishlistId, items, fetchWishlist]
  );

  const remove = useCallback(
    async (productId: string) => {
      const existing = items.find((i) => i.product_id === productId);
      if (existing) {
        await supabase.from('wishlist_items').delete().eq('id', existing.id);
        await fetchWishlist();
      }
    },
    [items, fetchWishlist]
  );

  const productIds = new Set(items.map((i) => i.product_id));

  return (
    <WishlistContext.Provider
      value={{ items, productIds, count: items.length, loading, wishlistId, toggle, has: (id) => productIds.has(id), remove, refresh: fetchWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
