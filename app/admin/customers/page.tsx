'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatPKR, formatDate } from '@/lib/format';
import type { Profile, Order } from '@/lib/types';
import { Search } from 'lucide-react';

export default function AdminCustomersPage() {
  return <AdminGuard><CustomersContent /></AdminGuard>;
}

function CustomersContent() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ profile: Profile; orders: Order[] } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles((data as Profile[]) ?? []);
    })();
  }, []);

  async function viewProfile(p: Profile) {
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', p.user_id).order('created_at', { ascending: false });
    setSelected({ profile: p, orders: (orders as Order[]) ?? [] });
  }

  async function toggleActive(p: Profile) {
    await supabase.from('profiles').update({ is_active: !p.is_active }).eq('id', p.id);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles((data as Profile[]) ?? []);
  }

  const filtered = profiles.filter((p) => (p.full_name ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-4 relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left"><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Joined</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="p-3 font-medium">{p.full_name ?? 'Unknown'}</td>
                <td className="p-3 text-muted-foreground">{p.phone ?? '—'}</td>
                <td className="p-3"><span className="capitalize">{p.role}</span></td>
                <td className="p-3">{p.is_active ? <span className="text-success">Active</span> : <span className="text-destructive">Disabled</span>}</td>
                <td className="p-3 text-muted-foreground">{formatDate(p.created_at)}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => viewProfile(p)}>View</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(p)}>{p.is_active ? 'Disable' : 'Enable'}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{selected.profile.full_name ?? 'Customer'}</h3>
            <p className="text-sm text-muted-foreground">{selected.profile.role} · {selected.profile.phone ?? 'No phone'}</p>
            <h4 className="mt-4 text-sm font-semibold">Orders ({selected.orders.length})</h4>
            <div className="mt-2 space-y-2">
              {selected.orders.map((o) => (
                <div key={o.id} className="flex justify-between rounded-md border p-2 text-sm">
                  <span>{o.order_number} · {formatDate(o.created_at)}</span>
                  <span className="font-medium">{formatPKR(o.total)}</span>
                </div>
              ))}
              {selected.orders.length === 0 && <p className="text-sm text-muted-foreground">No orders.</p>}
            </div>
            <Button variant="outline" className="mt-4" onClick={() => setSelected(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
