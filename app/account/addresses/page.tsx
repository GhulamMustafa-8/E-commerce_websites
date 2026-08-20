'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Address } from '@/lib/types';
import { Plus, Trash2, Check } from 'lucide-react';

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', province: '', postal_code: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setAddresses((data as Address[]) ?? []);
    })();
  }, [user]);

  if (loading) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('addresses').insert({ ...form, user_id: user!.id });
    setSaving(false);
    if (error) { toast.error('Could not add address.'); return; }
    toast.success('Address added!');
    setShowForm(false);
    setForm({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', province: '', postal_code: '' });
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setAddresses((data as Address[]) ?? []);
  }

  async function handleDelete(id: string) {
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success('Address removed.');
  }

  async function handleSetDefault(id: string) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setAddresses((data as Address[]) ?? []);
  }

  return (
    <div className="container-ec py-6">
      <h1 className="text-2xl font-bold">My Addresses</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <Button onClick={() => setShowForm(!showForm)} className="mb-4">
            <Plus className="mr-2 h-4 w-4" /> Add New Address
          </Button>
          {showForm && (
            <form onSubmit={handleAdd} className="mb-6 space-y-4 rounded-lg border bg-card p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="fn">Full Name</Label><Input id="fn" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label htmlFor="ph">Phone</Label><Input id="ph" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div><Label htmlFor="a1">Address Line 1</Label><Input id="a1" required value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} /></div>
              <div><Label htmlFor="a2">Address Line 2</Label><Input id="a2" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} /></div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><Label htmlFor="city">City</Label><Input id="city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label htmlFor="prov">Province</Label><Input id="prov" required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
                <div><Label htmlFor="pc">Postal Code</Label><Input id="pc" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Address'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}
          {addresses.length === 0 && !showForm ? (
            <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">No saved addresses yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div key={addr.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{addr.full_name}</p>
                      <p className="text-sm text-muted-foreground">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-sm text-muted-foreground">{addr.address_line2}</p>}
                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.province} {addr.postal_code}</p>
                      <p className="text-sm text-muted-foreground">{addr.phone}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(addr.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  {addr.is_default ? (
                    <p className="mt-2 text-xs font-medium text-success">Default Address</p>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => handleSetDefault(addr.id)}>Set as Default</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
