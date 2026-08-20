'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { Category, Brand } from '@/lib/types';

export function Filters({ categories, brands }: { categories: Category[]; brands: Brand[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(key: string, value?: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    startTransition(() => router.push(`/shop?${params.toString()}`));
  }

  const currentCategory = sp.get('category') ?? '';
  const currentBrand = sp.get('brand') ?? '';
  const currentSort = sp.get('sort') ?? 'featured';
  const minPrice = sp.get('minPrice');
  const maxPrice = sp.get('maxPrice');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    minPrice ? Number(minPrice) : 0,
    maxPrice ? Number(maxPrice) : 25000,
  ]);

  return (
    <div className="space-y-5 rounded-lg border bg-card p-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Sort by</h3>
        <Select value={currentSort} onValueChange={(v) => update('sort', v)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="bestselling">Best Selling</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold">Categories</h3>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Checkbox id={`cat-${c.id}`} checked={currentCategory === c.slug} onCheckedChange={() => update('category', currentCategory === c.slug ? undefined : c.slug)} />
              <Label htmlFor={`cat-${c.id}`} className="text-sm font-normal">{c.name}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold">Brands</h3>
        <div className="space-y-2">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center gap-2">
              <Checkbox id={`brand-${b.id}`} checked={currentBrand === b.slug} onCheckedChange={() => update('brand', currentBrand === b.slug ? undefined : b.slug)} />
              <Label htmlFor={`brand-${b.id}`} className="text-sm font-normal">{b.name}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold">Price Range</h3>
        <Slider min={0} max={25000} step={500} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} onValueCommit={(v) => { update('minPrice', String(v[0])); update('maxPrice', String(v[1])); }} className="my-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>PKR {priceRange[0].toLocaleString()}</span>
          <span>PKR {priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={() => router.push('/shop')} disabled={isPending}>
        Clear Filters
      </Button>
    </div>
  );
}
