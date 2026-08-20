'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, MapPin, Star, LogOut, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/auth-context';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/account', label: 'Profile', icon: User },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/reviews', label: 'My Reviews', icon: Star },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold">{profile?.full_name ?? 'My Account'}</p>
          <p className="text-xs text-muted-foreground">{profile?.role}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
          <Button variant="ghost" className="mt-2 justify-start text-destructive" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </nav>
      </div>
    </div>
  );
}
