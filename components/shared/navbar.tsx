'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Menu, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/lib/context/cart-context';
import { useWishlist } from '@/lib/context/wishlist-context';
import { useAuth } from '@/lib/context/auth-context';
import { CartDrawer } from '@/components/shared/cart-drawer';
import { supabase } from '@/lib/supabase/client';
import type { Category } from '@/lib/types';

export function Navbar() {
  const router = useRouter();
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, profile, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('sort_order');
      if (data) setCategories(data as Category[]);
    })();
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container-ec flex h-16 items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetTitle className="mb-4">Menu</SheetTitle>
              <nav className="flex flex-col gap-1">
                <Link href="/" className="rounded-md px-3 py-2 text-sm hover:bg-accent" onClick={() => setMobileOpen(false)}>Home</Link>
                <Link href="/shop" className="rounded-md px-3 py-2 text-sm hover:bg-accent" onClick={() => setMobileOpen(false)}>All Products</Link>
                {categories.map((c) => (
                  <Link key={c.id} href={`/categories/${c.slug}`} className="rounded-md px-3 py-2 text-sm hover:bg-accent" onClick={() => setMobileOpen(false)}>
                    {c.name}
                  </Link>
                ))}
                {user && (
                  <Link href="/account" className="rounded-md px-3 py-2 text-sm hover:bg-accent" onClick={() => setMobileOpen(false)}>My Account</Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Souk</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {categories.map((c) => (
              <Link key={c.id} href={`/categories/${c.slug}`} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {c.name}
              </Link>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 sm:block md:max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="pl-9" aria-label="Search products" />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:ml-2">
            <Button asChild variant="ghost" size="icon" aria-label="Wishlist" className="relative">
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
                {wishCount > 0 && <Badge>{wishCount}</Badge>}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCartOpen(true)} aria-label="Cart" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && <Badge>{count}</Badge>}
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Account" className="relative">
              <Link href={user ? '/account' : '/auth/login'}>
                <User className="h-5 w-5" />
              </Link>
            </Button>
            {isAdmin && (
              <Button asChild variant="ghost" size="icon" aria-label="Admin" className="hidden md:inline-flex">
                <Link href="/admin"><Package className="h-5 w-5" /></Link>
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={submitSearch} className="border-t px-4 py-2 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="pl-9" aria-label="Search products" />
          </div>
        </form>
      </header>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
      {children}
    </span>
  );
}
