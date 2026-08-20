'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Inventory, Product } from '@/lib/types';

export default function AdminInventoryPage() {
  return <AdminGuard><InventoryContent /></AdminGuard>;
}

function InventoryContent() {
  const [rows, setRows] = useState<(Inventory & { product?: Product })[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('inventory').select('*, product:products(*)').order('created_at', { ascending: false });
    setRows((data as (Inventory & { product?: Product })[]) ?? []);
  }

  async function saveStock(id: string) {
    const newStock = Number(editing[id]);
    if (isNaN(newStock)) return;
    const { error } = await supabase.from('inventory').update({ stock_quantity: newStock }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Stock updated!');
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
    load();
  }

  const filtered = rows.filter((r) => r.product?.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Input placeholder="Search inventory…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left"><th className="p-3">Product</th><th className="p-3">SKU</th><th className="p-3">Stock</th><th className="p-3">Reserved</th><th className="p-3">Available</th><th className="p-3">Status</th><th className="p-3 text-right">Update</th></tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => {
              const available = r.stock_quantity - r.reserved_quantity;
              const isLow = r.stock_quantity <= r.low_stock_threshold;
              return (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">{r.product?.name ?? 'Unknown'}</td>
                  <td className="p-3 text-muted-foreground">{r.sku ?? r.product?.sku ?? '—'}</td>
                  <td className="p-3">
                    {editing[r.id] !== undefined ? (
                      <Input type="number" value={editing[r.id]} onChange={(e) => setEditing({ ...editing, [r.id]: e.target.value })} className="h-8 w-20" />
                    ) : r.stock_quantity}
                  </td>
                  <td className="p-3 text-muted-foreground">{r.reserved_quantity}</td>
                  <td className="p-3">{available}</td>
                  <td className="p-3">{isLow ? <span className="text-destructive">Low</span> : <span className="text-success">OK</span>}</td>
                  <td className="p-3 text-right">
                    {editing[r.id] !== undefined ? (
                      <Button size="sm" onClick={() => saveStock(r.id)}>Save</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setEditing({ ...editing, [r.id]: String(r.stock_quantity) })}>Edit</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
