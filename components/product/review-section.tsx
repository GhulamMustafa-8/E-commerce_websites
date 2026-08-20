'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RatingStars } from '@/components/shared/rating-stars';
import { toast } from 'sonner';
import type { Review } from '@/lib/types';
import { formatDate } from '@/lib/format';

export function ReviewSection({ productId, ratingAvg, ratingCount }: { productId: string; ratingAvg: number; ratingCount: number }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_user_id_fkey(*)')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setReviews((data as Review[]) ?? []);
      setLoading(false);
    })();
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to leave a review.'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating,
      title,
      body,
      is_verified_purchase: false,
      is_approved: true,
    });
    setSubmitting(false);
    if (error) { toast.error('Could not submit review.'); return; }
    toast.success('Review submitted!');
    setTitle(''); setBody(''); setRating(5);
    const { data } = await supabase.from('reviews').select('*, profiles!reviews_user_id_fkey(*)').eq('product_id', productId).eq('is_approved', true).order('created_at', { ascending: false });
    setReviews((data as Review[]) ?? []);
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">Customer Reviews</h2>
        <div className="flex items-center gap-2">
          <RatingStars value={ratingAvg} />
          <span className="text-sm text-muted-foreground">{ratingAvg.toFixed(1)} ({ratingCount})</span>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Submit form */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-semibold">Write a Review</h3>
          {user ? (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div>
                <Label>Rating</Label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                      <RatingStars value={n <= rating ? 5 : 0} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <Label htmlFor="body">Review</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
              </div>
              <Button type="submit" disabled={submitting}>Submit Review</Button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Please <a href="/auth/login" className="text-primary underline">sign in</a> to write a review.</p>
          )}
        </div>

        {/* Reviews list */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{r.profiles?.full_name ?? 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                  </div>
                  <RatingStars value={r.rating} />
                </div>
                {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
                {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                {r.is_verified_purchase && <p className="mt-2 text-xs text-success">Verified Purchase</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
