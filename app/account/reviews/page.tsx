'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { RatingStars } from '@/components/shared/rating-stars';
import { formatDate } from '@/lib/format';
import type { Review, Product } from '@/lib/types';

export default function MyReviewsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [reviews, setReviews] = useState<(Review & { product?: Product })[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, product:products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setReviews((data as (Review & { product?: Product })[]) ?? []);
      setLoadingReviews(false);
    })();
  }, [user]);

  if (loading) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return null;

  return (
    <div className="container-ec py-6">
      <h1 className="text-2xl font-bold">My Reviews</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          {loadingReviews ? (
            <p className="text-sm text-muted-foreground">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">You haven&apos;t written any reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-lg border bg-card p-4">
                  {r.product && (
                    <Link href={`/products/${r.product.slug}`} className="text-sm font-medium hover:underline">{r.product.name}</Link>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <RatingStars value={r.rating} />
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  </div>
                  {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
                  {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
