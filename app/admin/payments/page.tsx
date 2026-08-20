'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatPKR, formatDate } from '@/lib/format';
import type { Payment, Order } from '@/lib/types';

export default function AdminPaymentsPage() {
  return <AdminGuard><PaymentsContent /></AdminGuard>;
}

function PaymentsContent() {
  const [payments, setPayments] = useState<(Payment & { orders?: Order })[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('payments').select('*, orders(*)').order('created_at', { ascending: false });
      setPayments((data as (Payment & { orders?: Order })[]) ?? []);
    })();
  }, []);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Order</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Amount</th><th className="p-3">Date</th></tr></thead>
        <tbody className="divide-y">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30">
              <td className="p-3 font-medium">{p.orders?.order_number ?? p.order_id}</td>
              <td className="p-3 capitalize">{p.method.replace(/_/g, ' ')}</td>
              <td className="p-3"><Badge>{p.status}</Badge></td>
              <td className="p-3 font-medium">{formatPKR(p.amount)}</td>
              <td className="p-3 text-muted-foreground">{formatDate(p.created_at)}</td>
            </tr>
          ))}
          {payments.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No payments yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
