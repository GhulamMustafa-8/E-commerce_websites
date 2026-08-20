import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  function pageHref(p: number) {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (p > 1) params.set('page', String(p)); else params.delete('page');
    return `/shop?${params.toString()}`;
  }

  const pages: (number | '…')[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  if (start > 1) { pages.push(1); if (start > 2) pages.push('…'); }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) { if (end < totalPages - 1) pages.push('…'); pages.push(totalPages); }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      {currentPage > 1 && (
        <Button asChild variant="outline" size="icon"><Link href={pageHref(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Link></Button>
      )}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button asChild key={p} variant={p === currentPage ? 'default' : 'outline'} size="icon"><Link href={pageHref(p)}>{p}</Link></Button>
        )
      )}
      {currentPage < totalPages && (
        <Button asChild variant="outline" size="icon"><Link href={pageHref(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Link></Button>
      )}
    </nav>
  );
}
