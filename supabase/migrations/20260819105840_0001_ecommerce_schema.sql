/*
# E-Commerce Core Schema

1. Overview
This migration creates the full relational schema for a production e-commerce platform:
profiles, categories, brands, products, product variants, images, inventory,
reviews, carts, cart items, wishlist, addresses, orders, order items, payments,
coupons, coupon usage, shipping zones, and notifications.

2. New Tables
- profiles, categories, brands, products, product_variants, product_images, inventory,
  reviews, carts, cart_items, wishlists, wishlist_items, addresses, orders, order_items,
  payments, coupons, coupon_usages, shipping_zones, notifications.

3. Security
- RLS enabled on every table.
- Public read access (anon + authenticated) on catalog tables so the storefront works without sign-in.
- Owner-scoped CRUD for carts, cart_items, wishlists, wishlist_items, addresses, orders, payments,
  notifications, reviews (own), profiles (own).
- Admin write access enforced via SECURITY DEFINER function is_admin() checking JWT app_metadata.role.

4. Important Notes
- UUIDs for all primary keys; timestamps default to now().
- profiles.user_id defaults to auth.uid() so authenticated inserts work when client omits owner.
- carts.user_id nullable to support guest carts keyed by guest_token.
- Orders/order_items store price/name/address snapshots so historical orders are immutable.
- Inventory uses reserved_quantity; available = stock - reserved, managed at checkout.
*/

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() unique references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  seo_title text,
  seo_description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_parent_idx on public.categories(parent_id);
alter table public.categories enable row level security;
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select to anon, authenticated using (true);
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.brands enable row level security;
drop policy if exists "brands_public_read" on public.brands;
create policy "brands_public_read" on public.brands for select to anon, authenticated using (true);
drop policy if exists "brands_admin_write" on public.brands;
create policy "brands_admin_write" on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text unique,
  barcode text,
  description text,
  short_description text,
  price numeric(12,2) not null,
  sale_price numeric(12,2),
  cost_price numeric(12,2),
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  weight numeric(10,2),
  dimensions text,
  features text,
  specifications jsonb,
  tags text[],
  is_published boolean not null default true,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_new boolean not null default false,
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_brand_idx on public.products(brand_id);
create index if not exists products_published_idx on public.products(is_published);
alter table public.products enable row level security;
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (is_published = true or public.is_admin());
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  size text,
  color text,
  color_hex text,
  price_override numeric(12,2),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists variants_product_idx on public.product_variants(product_id);
alter table public.product_variants enable row level security;
drop policy if exists "variants_public_read" on public.product_variants;
create policy "variants_public_read" on public.product_variants for select to anon, authenticated using (true);
drop policy if exists "variants_admin_write" on public.product_variants;
create policy "variants_admin_write" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists images_product_idx on public.product_images(product_id);
alter table public.product_images enable row level security;
drop policy if exists "images_public_read" on public.product_images;
create policy "images_public_read" on public.product_images for select to anon, authenticated using (true);
drop policy if exists "images_admin_write" on public.product_images;
create policy "images_admin_write" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  sku text,
  stock_quantity int not null default 0,
  reserved_quantity int not null default 0,
  low_stock_threshold int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inventory_product_idx on public.inventory(product_id);
create index if not exists inventory_variant_idx on public.inventory(variant_id);
alter table public.inventory enable row level security;
drop policy if exists "inventory_public_read" on public.inventory;
create policy "inventory_public_read" on public.inventory for select to anon, authenticated using (true);
drop policy if exists "inventory_admin_write" on public.inventory;
create policy "inventory_admin_write" on public.inventory for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_item_id uuid,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  is_verified_purchase boolean not null default false,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews(product_id);
alter table public.reviews enable row level security;
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select to anon, authenticated using (is_approved = true or auth.uid() = user_id or public.is_admin());
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "reviews_admin_moderate" on public.reviews;
create policy "reviews_admin_moderate" on public.reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete" on public.reviews for delete to authenticated using (public.is_admin());

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists carts_user_idx on public.carts(user_id);
create index if not exists carts_guest_idx on public.carts(guest_token);
alter table public.carts enable row level security;
drop policy if exists "carts_select_own" on public.carts;
create policy "carts_select_own" on public.carts for select to authenticated using (auth.uid() = user_id);
drop policy if exists "carts_insert_own" on public.carts;
create policy "carts_insert_own" on public.carts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "carts_update_own" on public.carts;
create policy "carts_update_own" on public.carts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "carts_delete_own" on public.carts;
create policy "carts_delete_own" on public.carts for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
alter table public.cart_items enable row level security;
drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own" on public.cart_items for select to authenticated using (exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid()));
drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own" on public.cart_items for insert to authenticated with check (exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid()));
drop policy if exists "cart_items_update_own" on public.cart_items;
create policy "cart_items_update_own" on public.cart_items for update to authenticated using (exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())) with check (exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid()));
drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own" on public.cart_items for delete to authenticated using (exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid()));

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists wishlists_user_idx on public.wishlists(user_id);
alter table public.wishlists enable row level security;
drop policy if exists "wishlists_select_own" on public.wishlists;
create policy "wishlists_select_own" on public.wishlists for select to authenticated using (auth.uid() = user_id);
drop policy if exists "wishlists_insert_own" on public.wishlists;
create policy "wishlists_insert_own" on public.wishlists for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "wishlists_delete_own" on public.wishlists;
create policy "wishlists_delete_own" on public.wishlists for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists wishlist_items_wishlist_idx on public.wishlist_items(wishlist_id);
alter table public.wishlist_items enable row level security;
drop policy if exists "wishlist_items_select_own" on public.wishlist_items;
create policy "wishlist_items_select_own" on public.wishlist_items for select to authenticated using (exists (select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid()));
drop policy if exists "wishlist_items_insert_own" on public.wishlist_items;
create policy "wishlist_items_insert_own" on public.wishlist_items for insert to authenticated with check (exists (select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid()));
drop policy if exists "wishlist_items_delete_own" on public.wishlist_items;
create policy "wishlist_items_delete_own" on public.wishlist_items for delete to authenticated using (exists (select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid()));

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  province text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses(user_id);
alter table public.addresses enable row level security;
drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own" on public.addresses for select to authenticated using (auth.uid() = user_id);
drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own" on public.addresses for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own" on public.addresses for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own" on public.addresses for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  value numeric(12,2) not null,
  min_order_amount numeric(12,2) default 0,
  max_discount numeric(12,2),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int,
  per_user_limit int,
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;
drop policy if exists "coupons_public_read" on public.coupons;
create policy "coupons_public_read" on public.coupons for select to anon, authenticated using (is_active = true);
drop policy if exists "coupons_admin_write" on public.coupons;
create policy "coupons_admin_write" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','return_requested','returned','refunded')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  shipping_address jsonb,
  billing_address jsonb,
  payment_method text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','cod')),
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  tracking_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);
alter table public.orders enable row level security;
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders for update to authenticated using (public.is_admin() or auth.uid() = user_id) with check (public.is_admin() or auth.uid() = user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text,
  price numeric(12,2) not null,
  quantity int not null,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);
alter table public.order_items enable row level security;
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cod')),
  amount numeric(12,2) not null,
  transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments(order_id);
alter table public.payments enable row level security;
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments for select to authenticated using (exists (select 1 from public.orders o where o.id = payments.order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "payments_admin_update" on public.payments;
create policy "payments_admin_update" on public.payments for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists coupon_usages_coupon_idx on public.coupon_usages(coupon_id);
create index if not exists coupon_usages_user_idx on public.coupon_usages(user_id);
alter table public.coupon_usages enable row level security;
drop policy if exists "coupon_usages_select_own" on public.coupon_usages;
create policy "coupon_usages_select_own" on public.coupon_usages for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "coupon_usages_insert_own" on public.coupon_usages;
create policy "coupon_usages_insert_own" on public.coupon_usages for insert to authenticated with check (auth.uid() = user_id);

create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  charge numeric(12,2) not null default 0,
  free_shipping_threshold numeric(12,2),
  estimated_days text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists shipping_zones_city_idx on public.shipping_zones(city);
alter table public.shipping_zones enable row level security;
drop policy if exists "shipping_zones_public_read" on public.shipping_zones;
create policy "shipping_zones_public_read" on public.shipping_zones for select to anon, authenticated using (true);
drop policy if exists "shipping_zones_admin_write" on public.shipping_zones;
create policy "shipping_zones_admin_write" on public.shipping_zones for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id);
alter table public.notifications enable row level security;
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications for insert to authenticated with check (auth.uid() = user_id);

do $$
declare t text;
begin
  for t in select unnest(array['profiles','categories','brands','products','inventory','reviews','orders','payments','coupons','addresses','shipping_zones'])
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();', t);
  end loop;
end $$;
