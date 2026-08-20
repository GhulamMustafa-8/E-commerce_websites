'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated!');
    router.push('/account');
  }

  return (
    <div className="container-ec flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8">
        <h1 className="text-2xl font-bold">Set New Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Updating…' : 'Update Password'}</Button>
        </form>
      </div>
    </div>
  );
}
