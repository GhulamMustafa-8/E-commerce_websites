'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/login'); return; }
    if (profile?.role !== 'admin') { router.push('/'); return; }
    setChecked(true);
  }, [loading, user, profile, router]);

  if (!checked) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Checking access…</div>;

  return (
    <div className="container-ec py-6">
      <h1 className="mb-4 text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <AdminSidebar />
        <div>{children}</div>
      </div>
    </div>
  );
}
