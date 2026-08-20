'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { slugify } from '@/lib/format';
import type { Category } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminCategoriesPage() {
  return <AdminGuard><CategoriesContent /></AdminGuard>;
}

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parent_id: '', is_active: true });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories((data as Category[]) ?? []);
  }

  function openNew() { setEditing(null); setForm({ name: '', slug: '', description: '', parent_id: '', is_active: true }); setOpen(true); }
  function openEdit(c: Category) { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description ?? '', parent_id: c.parent_id ?? '', is_active: c.is_active }); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: form.name, slug: form.slug || slugify(form.name), description: form.description || null, parent_id: form.parent_id || null, is_active: form.is_active };
    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Category updated!');
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Category created!');
    }
    setOpen(false); load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    load(); toast.success('Deleted.');
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Parent Category</Label>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                  <option value="">None (Top level)</option>
                  {categories.filter((c) => c.id !== editing?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
              <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
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
