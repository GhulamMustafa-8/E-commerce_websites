'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPKR, formatDateTime } from '@/lib/format';
import type { Order } from '@/lib/types';
import { ArrowLeft, Package } from 'lucide-react';

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !params.id) return;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', params.id)
        .maybeSingle();
      setOrder(data as Order | null);
      setLoadingOrder(false);
    })();
  }, [user, params.id]);

  if (loading || loadingOrder) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!order) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Order not found.</div>;

  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="container-ec py-6">
      <Link href="/account/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>
      <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
      <p className="text-sm text-muted-foreground">Placed on {formatDateTime(order.created_at)}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div className="space-y-6">
          {/* Status tracker */}
          {order.status !== 'cancelled' && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Order Status</h2>
              <div className="flex flex-wrap gap-2">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {i <= currentStep ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs ${i <= currentStep ? 'font-medium' : 'text-muted-foreground'}`}>{step.replace(/_/g, ' ')}</span>
                    {i < statusSteps.length - 1 && <div className={`mx-1 h-0.5 w-6 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />}
                  </div>
                ))}
              </div>
              {order.tracking_number && <p className="mt-4 text-sm">Tracking Number: <span className="font-medium">{order.tracking_number}</span></p>}
            </div>
          )}

          {/* Items */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Items</h2>
            <div className="divide-y">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex gap-4 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {item.image_url && <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_name && <p className="text-xs text-muted-foreground">{item.variant_name}</p>}
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatPKR(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatPKR(order.discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{order.shipping_cost === 0 ? 'Free' : formatPKR(order.shipping_cost)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatPKR(order.tax)}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatPKR(order.total)}</span></div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid gap-4 sm:grid-cols-2">
            {order.shipping_address && (
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-2 text-sm font-semibold">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">{order.shipping_address.full_name}</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.address_line1}</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.city}, {order.shipping_address.province}</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.phone}</p>
              </div>
            )}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">Payment</h3>
              <p className="text-sm text-muted-foreground">Method: {order.payment_method}</p>
              <Badge className="mt-1">{order.payment_status}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
