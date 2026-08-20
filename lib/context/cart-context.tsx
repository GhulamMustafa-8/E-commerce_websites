'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth-context';
import type { CartItem, CartLine, Product, ProductVariant } from '@/lib/types';
import { effectivePrice } from '@/lib/format';

interface CartContextValue {
  items: CartItem[];
  lines: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  cartId: string | null;
  addToCart: (product: Product, variant: ProductVariant | null, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  lines: [],
  count: 0,
  subtotal: 0,
  loading: true,
  cartId: null,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

const GUEST_TOKEN_KEY = 'ec_guest_cart_token';

function getGuestToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  }
  return token;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setCartId(null);
      setLoading(false);
      return;
    }
    let { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!cart) {
      const { data: newCart } = await supabase
        .from('carts')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      cart = newCart;
    }
    if (!cart) {
      setLoading(false);
      return;
    }
    setCartId(cart.id);
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('*, product:products(*), variant:product_variants(*)')
      .eq('cart_id', cart.id);
    setItems((cartItems as CartItem[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(
    async (product: Product, variant: ProductVariant | null, quantity: number) => {
      if (!user || !cartId) return;
      const existing = items.find((i) => i.product_id === product.id && i.variant_id === (variant?.id ?? null));
      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({ cart_id: cartId, product_id: product.id, variant_id: variant?.id ?? null, quantity });
      }
      await fetchCart();
    },
    [user, cartId, items, fetchCart]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
      await fetchCart();
    },
    [fetchCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await supabase.from('cart_items').delete().eq('id', itemId);
      await fetchCart();
    },
    [fetchCart]
  );

  const clearCart = useCallback(async () => {
    if (!cartId) return;
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
    await fetchCart();
  }, [cartId, fetchCart]);

  const lines: CartLine[] = items.map((i) => {
    const unitPrice = i.variant?.price_override
      ? effectivePrice(i.variant.price_override, null)
      : effectivePrice(i.product?.price ?? 0, i.product?.sale_price ?? null);
    return {
      ...i,
      unitPrice,
      lineTotal: unitPrice * i.quantity,
      available: i.product?.inventory?.[0]?.stock_quantity ?? 0,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, lines, count, subtotal, loading, cartId, addToCart, updateQuantity, removeItem, clearCart, refreshCart: fetchCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
