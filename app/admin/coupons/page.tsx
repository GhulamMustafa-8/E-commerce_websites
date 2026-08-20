'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';
import type { Coupon } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminCouponsPage() {
  return <AdminGuard><CouponsContent /></AdminGuard>;
}

function CouponsContent() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', value: '', min_order_amount: '', max_discount: '', is_active: true });

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data as Coupon[]) ?? []);
  }

  function openNew() { setEditing(null); setForm({ code: '', discount_type: 'percentage', value: '', min_order_amount: '', max_discount: '', is_active: true }); setOpen(true); }
  function openEdit(c: Coupon) { setEditing(c); setForm({ code: c.code, discount_type: c.discount_type, value: String(c.value), min_order_amount: String(c.min_order_amount), max_discount: c.max_discount ? String(c.max_discount) : '', is_active: c.is_active }); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      value: Number(form.value),
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      is_active: form.is_active,
    };
    if (editing) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Saved!'); setOpen(false); load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id); load(); toast.success('Deleted.');
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Coupon' : 'New Coupon'}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Code</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
              <div><Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Value {form.discount_type === 'percentage' ? '(%)' : '(PKR)'}</Label><Input required type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div><Label>Min Order Amount</Label><Input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} /></div>
              <div><Label>Max Discount (PKR)</Label><Input type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
              <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Code</th><th className="p-3">Type</th><th className="p-3">Value</th><th className="p-3">Min Order</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="p-3 font-mono font-medium">{c.code}</td>
                <td className="p-3"><Badge variant="outline">{c.discount_type}</Badge></td>
                <td className="p-3">{c.discount_type === 'percentage' ? `${c.value}%` : `PKR ${c.value}`}</td>
                <td className="p-3 text-muted-foreground">{c.min_order_amount}</td>
                <td className="p-3">{c.is_active ? <span className="text-success">Active</span> : <span className="text-muted-foreground">Inactive</span>}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
