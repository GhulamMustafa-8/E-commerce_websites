'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RatingStars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(sizes[size], n <= Math.round(value) ? 'fill-accent text-accent' : 'fill-muted text-muted')}
        />
      ))}
    </div>
  );
}
