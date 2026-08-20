'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';
import type { Review, Product, Profile } from '@/lib/types';
import { Check, X } from 'lucide-react';

export default function AdminReviewsPage() {
  return <AdminGuard><ReviewsContent /></AdminGuard>;
}

function ReviewsContent() {
  const [reviews, setReviews] = useState<(Review & { product?: Product; profiles?: Profile })[]>([]);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from('reviews').select('*, product:products(*), profiles!reviews_user_id_fkey(*)').order('created_at', { ascending: false });
    setReviews((data as (Review & { product?: Product; profiles?: Profile })[]) ?? []);
  }

  async function approve(id: string) {
    await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
    toast.success('Review approved!'); load();
  }
  async function hide(id: string) {
    await supabase.from('reviews').update({ is_approved: false }).eq('id', id);
    toast.success('Review hidden.'); load();
  }
  async function remove(id: string) {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    toast.success('Deleted.'); load();
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Product</th><th className="p-3">User</th><th className="p-3">Rating</th><th className="p-3">Review</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y">
          {reviews.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="p-3 font-medium">{r.product?.name ?? 'Unknown'}</td>
              <td className="p-3 text-muted-foreground">{r.profiles?.full_name ?? 'Anonymous'}</td>
              <td className="p-3">{r.rating}/5</td>
              <td className="p-3 max-w-xs"><p className="line-clamp-2 text-muted-foreground">{r.body ?? r.title}</p></td>
              <td className="p-3"><Badge variant={r.is_approved ? 'default' : 'secondary'}>{r.is_approved ? 'Approved' : 'Hidden'}</Badge></td>
              <td className="p-3 text-right">
                {!r.is_approved && <Button variant="ghost" size="icon" onClick={() => approve(r.id)} title="Approve"><Check className="h-4 w-4 text-success" /></Button>}
                {r.is_approved && <Button variant="ghost" size="icon" onClick={() => hide(r.id)} title="Hide"><X className="h-4 w-4" /></Button>}
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(r.id)} title="Delete"><X className="h-4 w-4" /></Button>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No reviews yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
