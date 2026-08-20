'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/context/cart-context';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatPKR } from '@/lib/format';
import { Check, ChevronLeft, ChevronRight, Truck, CreditCard, Banknote, MapPin, ClipboardCheck } from 'lucide-react';
import type { Address } from '@/lib/types';

const steps = ['Information', 'Shipping', 'Delivery', 'Payment', 'Review'];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { lines, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
      setAddresses((data as Address[]) ?? []);
      if (data && data.length > 0) setSelectedAddress(data[0].id);
    })();
  }, [user]);

  if (authLoading) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return null;
  if (lines.length === 0 && !orderId) {
    return (
      <div className="container-ec py-12">
        <div className="mx-auto max-w-md rounded-lg border p-8 text-center">
          <h1 className="text-xl font-bold">Your cart is empty</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add items before checking out.</p>
          <Button asChild className="mt-4"><Link href="/shop">Browse Products</Link></Button>
        </div>
      </div>
    );
  }

  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + shipping;

  async function placeOrder() {
    setPlacing(true);
    const addr = addresses.find((a) => a.id === selectedAddress);
    if (!addr) { toast.error('Please select a shipping address.'); setPlacing(false); return; }

    const items = lines.map((l) => ({
      product_id: l.product_id,
      variant_id: l.variant_id,
      quantity: l.quantity,
      variant_name: l.variant ? `${l.variant.size ?? ''} ${l.variant.color ?? ''}`.trim() : null,
    }));

    const shippingAddress = {
      full_name: addr.full_name,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 ?? '',
      city: addr.city,
      province: addr.province,
      postal_code: addr.postal_code ?? '',
      phone: addr.phone,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ items, shippingAddress, paymentMethod, couponCode: couponCode || undefined }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? 'Checkout failed');
        setPlacing(false);
        return;
      }
      setOrderId(result.orderId);
      await clearCart();
      setStep(5);
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setPlacing(false);
    }
  }

  // Confirmation screen
  if (orderId) {
    return (
      <div className="container-ec py-12">
        <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Order Confirmed!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Thank you for your purchase. We&apos;ll send you a confirmation shortly.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline"><Link href="/shop">Continue Shopping</Link></Button>
            <Button asChild><Link href="/account/orders">View Orders</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-ec py-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* Stepper */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs ${i <= step ? 'font-medium' : 'text-muted-foreground'}`}>{s}</span>
            {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 0: Information */}
          {step === 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Customer Information</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><Label>Name</Label><Input value={user?.email ?? ''} disabled className="bg-muted" /></div>
                <div><Label>Email</Label><Input value={user?.email ?? ''} disabled className="bg-muted" /></div>
              </div>
              <Button className="mt-4" onClick={() => setStep(1)}>Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          )}

          {/* Step 1: Shipping address */}
          {step === 1 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              {addresses.length === 0 ? (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">No saved addresses. Please add one in your account.</p>
                  <Button asChild variant="outline" className="mt-3"><Link href="/account/addresses">Add Address</Link></Button>
                </div>
              ) : (
                <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="mt-4 space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <RadioGroupItem value={addr.id} id={`addr-${addr.id}`} className="mt-1" />
                      <label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
                        <p className="font-medium">{addr.full_name}</p>
                        <p className="text-sm text-muted-foreground">{addr.address_line1}, {addr.city}, {addr.province}</p>
                        <p className="text-sm text-muted-foreground">{addr.phone}</p>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(2)} disabled={!selectedAddress}>Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 2: Delivery */}
          {step === 2 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Delivery Method</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div><p className="font-medium">Standard Delivery</p><p className="text-xs text-muted-foreground">2-7 business days</p></div>
                  </div>
                  <span className="font-semibold">{shipping === 0 ? 'Free' : formatPKR(shipping)}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(3)}>Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <RadioGroupItem value="cod" id="cod" />
                  <label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2"><Banknote className="h-5 w-5" /><span className="font-medium">Cash on Delivery</span></div>
                    <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                  </label>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <RadioGroupItem value="bank_transfer" id="bt" />
                  <label htmlFor="bt" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2"><CreditCard className="h-5 w-5" /><span className="font-medium">Bank Transfer</span></div>
                    <p className="text-xs text-muted-foreground">Transfer to our bank account</p>
                  </label>
                </div>
              </RadioGroup>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(4)}>Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Review Your Order</h2>
              <div className="mt-4 divide-y">
                {lines.map((line) => (
                  <div key={line.id} className="flex justify-between py-3 text-sm">
                    <span>{line.product?.name} × {line.quantity}</span>
                    <span className="font-medium">{formatPKR(line.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="coupon">Coupon Code (optional)</Label>
                <Input id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="WELCOME10" />
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPKR(shipping)}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatPKR(total)}</span></div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={placeOrder} disabled={placing} size="lg">{placing ? 'Placing Order…' : 'Place Order'}</Button>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="mt-4 space-y-3">
              {lines.map((line) => (
                <div key={line.id} className="flex justify-between text-sm">
                  <span className="line-clamp-1">{line.product?.name} × {line.quantity}</span>
                  <span className="font-medium">{formatPKR(line.lineTotal)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPKR(shipping)}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatPKR(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
