# Souk — E-Commerce Platform

A full-stack, production-ready e-commerce web application built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase (PostgreSQL + Auth + Edge Functions).

## Features

- **Storefront**: Home, Shop (filters, sorting, pagination), Product Details (gallery, variants, reviews, related), Search, Category pages
- **Cart & Wishlist**: Persistent cart with stock validation, wishlist with move-to-cart
- **Auth**: Register, Login, Forgot/Reset Password, Profile management
- **Account**: Orders with status tracking, saved addresses, my reviews
- **Checkout**: Multi-step flow (Information → Shipping → Delivery → Payment → Review → Confirmation) with backend-validated order creation
- **Admin Dashboard**: Dashboard cards & charts, Products, Categories, Brands, Orders (status management), Customers, Inventory, Coupons, Reviews (moderation), Payments, Shipping zones, Settings
- **AI Shopping Assistant**: Chat UI that queries products by keyword, price, category
- **SEO**: Dynamic metadata, sitemap, robots, structured data (Product schema), 404/500 pages
- **Security**: RLS on all tables, role-based admin access, backend price/stock validation, JWT auth

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, lucide-react
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Cash on Delivery, Bank Transfer (provider abstraction for future Easypaisa/JazzCash/Card)

## Getting Started

The dev server runs automatically. Environment variables for Supabase are pre-configured.

### Create an admin account

1. Register a new account at `/auth/register`
2. In the Supabase dashboard, set the user's `app_metadata.role` to `"admin"` (or run the SQL below using the service role)

```sql
-- In Supabase SQL editor (service role bypasses RLS)
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'your-admin@email.com';
```

3. Also update the profiles table:

```sql
update public.profiles set role = 'admin' where user_id = (
  select id from auth.users where email = 'your-admin@email.com'
);
```

4. Sign in — the admin dashboard link appears in the navbar.

## Architecture

```
app/                    Next.js App Router pages
  admin/                Admin dashboard (role-protected)
  account/              Customer account pages
  auth/                 Authentication pages
  checkout/             Multi-step checkout
  products/[slug]/      Product detail
  categories/[slug]/    Category listing
  shop/                 Shop with filters
  search/               Search results
components/
  shared/               Navbar, Footer, ProductCard, CartDrawer, AI Assistant
  shop/                 Filters, ProductGrid, Pagination
  product/              Gallery, Options, Reviews
  admin/                AdminSidebar, AdminGuard
  account/              AccountSidebar
  ui/                   shadcn/ui components
lib/
  context/              Auth, Cart, Wishlist contexts
  supabase/             Client, server, admin clients
  types.ts              TypeScript types
  format.ts             Currency, date, slug helpers
supabase/
  functions/checkout/   Edge function for order creation
  migrations/           SQL migrations
```

## Order Flow

1. Customer adds products to cart
2. Goes through multi-step checkout
3. Checkout edge function validates stock, calculates totals (subtotal, discount, shipping, tax), reserves inventory, creates order + order items + payment, decreases stock, records coupon usage, sends notification
4. Customer sees order in account with status tracking
5. Admin updates order status → customer sees updated status

## License

MIT
