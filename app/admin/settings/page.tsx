'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <Card>
        <CardHeader><CardTitle>Store Settings</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Store settings such as name, currency, tax rate, and contact info can be configured here. This section is reserved for future configuration.</p>
        </CardContent>
      </Card>
    </AdminGuard>
  );
}
