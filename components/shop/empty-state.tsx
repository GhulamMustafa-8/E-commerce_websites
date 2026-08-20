import { PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
      <PackageSearch className="h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-semibold">No products found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
      <Button asChild variant="outline"><Link href="/shop">Clear filters</Link></Button>
    </div>
  );
}
