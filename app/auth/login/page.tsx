'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Welcome back!');
    await refreshProfile();
    router.push('/account');
  }

  return (
    <div className="container-ec flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back. Sign in to your account.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/auth/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          <Link href="/auth/register" className="text-primary hover:underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
