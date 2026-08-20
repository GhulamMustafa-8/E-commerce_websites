'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-ec flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">500</h1>
      <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">An unexpected error occurred. Please try again.</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
        <Button asChild variant="outline"><Link href="/">Back to Home</Link></Button>
      </div>
    </div>
  );
}
