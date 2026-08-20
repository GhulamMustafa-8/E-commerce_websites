'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Profile } from '@/lib/types';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  if (loading) return <div className="container-ec py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('user_id', user!.id);
    setSaving(false);
    if (error) { toast.error('Could not update profile.'); return; }
    await refreshProfile();
    toast.success('Profile updated!');
  }

  async function handleChangePassword() {
    const { error } = await supabase.auth.updateUser({ password: undefined as unknown as string });
    if (error) toast.error('Use the reset password page to change your password.');
  }

  return (
    <div className="container-ec py-6">
      <h1 className="text-2xl font-bold">My Account</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email ?? ''} disabled className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" />
              </div>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            </form>
          </div>
          <div className="mt-4 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Security</h2>
            <p className="mt-2 text-sm text-muted-foreground">To change your password, use the reset link sent to your email.</p>
            <Button variant="outline" className="mt-3" onClick={handleChangePassword}>Change Password</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
