'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatPKR } from '@/lib/format';
import type { ShippingZone } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminShippingPage() {
  return <AdminGuard><ShippingContent /></AdminGuard>;
}

function ShippingContent() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [form, setForm] = useState({ name: '', city: '', charge: '', free_shipping_threshold: '', estimated_days: '', is_active: true });

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('shipping_zones').select('*').order('city');
    setZones((data as ShippingZone[]) ?? []);
  }

  function openNew() { setEditing(null); setForm({ name: '', city: '', charge: '', free_shipping_threshold: '', estimated_days: '', is_active: true }); setOpen(true); }
  function openEdit(z: ShippingZone) { setEditing(z); setForm({ name: z.name, city: z.city, charge: String(z.charge), free_shipping_threshold: z.free_shipping_threshold ? String(z.free_shipping_threshold) : '', estimated_days: z.estimated_days ?? '', is_active: z.is_active }); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name, city: form.city, charge: Number(form.charge),
      free_shipping_threshold: form.free_shipping_threshold ? Number(form.free_shipping_threshold) : null,
      estimated_days: form.estimated_days || null, is_active: form.is_active,
    };
    if (editing) {
      const { error } = await supabase.from('shipping_zones').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('shipping_zones').insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Saved!'); setOpen(false); load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this shipping zone?')) return;
    await supabase.from('shipping_zones').delete().eq('id', id); load(); toast.success('Deleted.');
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Zone</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Zone' : 'New Shipping Zone'}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>City</Label><Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Charge (PKR)</Label><Input required type="number" value={form.charge} onChange={(e) => setForm({ ...form, charge: e.target.value })} /></div>
              <div><Label>Free Shipping Threshold</Label><Input type="number" value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })} /></div>
              <div><Label>Estimated Days</Label><Input value={form.estimated_days} onChange={(e) => setForm({ ...form, estimated_days: e.target.value })} placeholder="2-3 days" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
              <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Name</th><th className="p-3">City</th><th className="p-3">Charge</th><th className="p-3">Free Threshold</th><th className="p-3">Est. Days</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y">
            {zones.map((z) => (
              <tr key={z.id} className="hover:bg-muted/30">
                <td className="p-3 font-medium">{z.name}</td>
                <td className="p-3">{z.city}</td>
                <td className="p-3">{formatPKR(z.charge)}</td>
                <td className="p-3 text-muted-foreground">{z.free_shipping_threshold ? formatPKR(z.free_shipping_threshold) : '—'}</td>
                <td className="p-3 text-muted-foreground">{z.estimated_days ?? '—'}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(z)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(z.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
