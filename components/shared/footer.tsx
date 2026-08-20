'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await supabase.from('notifications').insert({ type: 'newsletter', title: 'Newsletter subscription', body: email, user_id: undefined as unknown as string }).then(() => {});
      toast.success('Thanks for subscribing!');
      setEmail('');
    } catch {
      toast.error('Could not subscribe. Try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="border-t bg-muted/30">
      <div className="container-ec py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 text-lg font-bold">Souk</h3>
            <p className="text-sm text-muted-foreground">
              Modern online shopping in Pakistan. Fashion, electronics, home and beauty delivered to your door.
            </p>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> support@souk.pk
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" /> 0800-SOUK-PK
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> Karachi, Pakistan
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shop" className="hover:text-foreground">All Products</Link></li>
              <li><Link href="/categories/fashion" className="hover:text-foreground">Fashion</Link></li>
              <li><Link href="/categories/electronics" className="hover:text-foreground">Electronics</Link></li>
              <li><Link href="/categories/home" className="hover:text-foreground">Home</Link></li>
              <li><Link href="/categories/beauty" className="hover:text-foreground">Beauty</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/account" className="hover:text-foreground">My Account</Link></li>
              <li><Link href="/wishlist" className="hover:text-foreground">Wishlist</Link></li>
              <li><Link href="/cart" className="hover:text-foreground">Cart</Link></li>
              <li><a href="#" className="hover:text-foreground">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-foreground">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Newsletter</h4>
            <p className="mb-3 text-sm text-muted-foreground">Get exclusive deals and new arrivals.</p>
            <form onSubmit={subscribe} className="flex gap-2">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" aria-label="Email address" />
              <Button type="submit" size="icon" disabled={loading} aria-label="Subscribe">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Souk. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
