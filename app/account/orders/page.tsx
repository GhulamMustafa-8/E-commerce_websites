'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatPKR, formatDate } from '@/lib/format';
import type { Order } from '@/lib/types';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-primary/20 text-primary',
  processing: 'bg-primary/20 text-primary',
  shipped: 'bg-chart-2/20 text-chart-2',
  out_for_delivery: 'bg-chart-2/20 text-chart-2',
  delivered: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
  returned: 'bg-muted text-muted-foreground',
  refunded: 'bg-muted text-muted-foreground',
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoadingOrders(false);
    })();
  }, [user]);

  if (loading) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return null;

  return (
    <div className="container-ec py-6">
      <h1 className="text-2xl font-bold">My Orders</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          {loadingOrders ? (
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed py-16 text-center">
              <p className="text-sm text-muted-foreground">You have no orders yet.</p>
              <Link href="/shop" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link key={order.id} href={`/account/orders/${order.id}`} className="block rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <Badge className={statusColors[order.status] ?? 'bg-muted'}>{order.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{order.order_items?.length ?? 0} item(s)</p>
                    <p className="font-semibold">{formatPKR(order.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
