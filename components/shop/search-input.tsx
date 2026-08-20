'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';

export function SearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? '');

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set('q', value); else params.delete('q');
      params.delete('page');
      router.push(`/shop?${params.toString()}`);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search products…" className="pl-9" aria-label="Search" />
    </div>
  );
}
