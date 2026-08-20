import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-ec flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Button asChild className="mt-6"><Link href="/"><Home className="mr-2 h-4 w-4" /> Back to Home</Link></Button>
    </div>
  );
}
