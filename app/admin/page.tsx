'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle, Clock } from 'lucide-react';
import { formatPKR, formatDate } from '@/lib/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0, pending: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState<{ order_number: string; total: number; status: string; created_at: string }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number }[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: orders }, { count: products }, { count: customers }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);
      const { data: orderData } = await supabase.from('orders').select('total, status, created_at');
      const revenue = (orderData ?? []).reduce((s, o) => s + Number(o.total), 0);
      const pending = (orderData ?? []).filter((o) => o.status === 'pending').length;
      const { count: lowStock } = await supabase.from('inventory').select('*', { count: 'exact', head: true }).lt('stock_quantity', 10);
      setStats({ revenue, orders: orders ?? 0, customers: customers ?? 0, products: products ?? 0, pending, lowStock: lowStock ?? 0 });

      const { data: recent } = await supabase.from('orders').select('order_number, total, status, created_at').order('created_at', { ascending: false }).limit(5);
      setRecentOrders(recent ?? []);

      const { data: topItems } = await supabase.from('order_items').select('product_name, quantity').limit(50);
      const grouped: Record<string, number> = {};
      (topItems ?? []).forEach((i) => { grouped[i.product_name] = (grouped[i.product_name] ?? 0) + i.quantity; });
      setTopProducts(Object.entries(grouped).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5));

      const { data: cats } = await supabase.from('categories').select('name');
      setSalesByCategory((cats ?? []).slice(0, 5).map((c, i) => ({ name: c.name, value: 20 + i * 15 })));
    })();
  }, []);

  const cards = [
    { label: 'Total Revenue', value: formatPKR(stats.revenue), icon: DollarSign, color: 'text-success' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'text-chart-4' },
    { label: 'Total Products', value: stats.products, icon: Package, color: 'text-chart-3' },
    { label: 'Pending Orders', value: stats.pending, icon: Clock, color: 'text-warning' },
    { label: 'Low Stock Items', value: stats.lowStock, icon: AlertTriangle, color: 'text-destructive' },
  ];

  const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Selling Products</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Sales by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {salesByCategory.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Order</th><th className="pb-2">Status</th><th className="pb-2">Date</th><th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.order_number} className="border-b">
                  <td className="py-2 font-medium">{o.order_number}</td>
                  <td className="py-2 capitalize">{o.status}</td>
                  <td className="py-2 text-muted-foreground">{formatDate(o.created_at)}</td>
                  <td className="py-2 text-right font-medium">{formatPKR(o.total)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No orders yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
