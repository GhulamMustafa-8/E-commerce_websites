/*
# Seed Data

1. Overview
Populates the store with demo categories, brands, products, variants, images,
inventory, reviews, coupons, and shipping zones so the storefront is fully
functional on first load. Admin and demo customer accounts are created via
Supabase Auth from the frontend; this migration only seeds catalog data.

2. Data inserted
- Categories: Fashion, Electronics, Home, Beauty (with subcategories)
- Brands: Urban Co., NovaTech, Lumen, Pure, Atlas
- Products: 12 demo products across categories with images, pricing, sale prices
- Product variants: size/color variants for apparel
- Inventory: stock rows per product/variant
- Reviews: a few approved reviews
- Coupons: WELCOME10, FREESHIP
- Shipping zones: major Pakistan cities
*/

-- Categories
insert into public.categories (name, slug, description, image_url, sort_order, is_active)
values
  ('Fashion', 'fashion', 'Clothing, footwear and accessories', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', 1, true),
  ('Electronics', 'electronics', 'Phones, audio and gadgets', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', 2, true),
  ('Home', 'home', 'Furnishings and decor', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800', 3, true),
  ('Beauty', 'beauty', 'Skincare and cosmetics', 'https://images.unsplash.com/photo-1522335789203-aaa2f0f4b9b6?w=800', 4, true)
on conflict (slug) do nothing;

-- Subcategories
insert into public.categories (name, slug, description, parent_id, sort_order, is_active)
select 'Men', 'fashion-men', 'Men''s fashion', c.id, 1, true from public.categories c where c.slug='fashion'
on conflict (slug) do nothing;
insert into public.categories (name, slug, description, parent_id, sort_order, is_active)
select 'Women', 'fashion-women', 'Women''s fashion', c.id, 2, true from public.categories c where c.slug='fashion'
on conflict (slug) do nothing;
insert into public.categories (name, slug, description, parent_id, sort_order, is_active)
select 'Audio', 'electronics-audio', 'Headphones and speakers', c.id, 1, true from public.categories c where c.slug='electronics'
on conflict (slug) do nothing;

-- Brands
insert into public.brands (name, slug, description, image_url, is_active)
values
  ('Urban Co.', 'urban-co', 'Modern everyday apparel', null, true),
  ('NovaTech', 'novatech', 'Consumer electronics', null, true),
  ('Lumen', 'lumen', 'Lighting and home', null, true),
  ('Pure', 'pure', 'Clean beauty', null, true),
  ('Atlas', 'atlas', 'Footwear and accessories', null, true)
on conflict (slug) do nothing;

-- Helper to get category/brand ids
do $$
declare
  fashion_id uuid; fashion_men_id uuid; fashion_women_id uuid;
  electronics_id uuid; electronics_audio_id uuid; home_id uuid; beauty_id uuid;
  urban_id uuid; nova_id uuid; lumen_id uuid; pure_id uuid; atlas_id uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid; p8 uuid; p9 uuid; p10 uuid; p11 uuid; p12 uuid;
begin
  select id into fashion_id from public.categories where slug='fashion';
  select id into fashion_men_id from public.categories where slug='fashion-men';
  select id into fashion_women_id from public.categories where slug='fashion-women';
  select id into electronics_id from public.categories where slug='electronics';
  select id into electronics_audio_id from public.categories where slug='electronics-audio';
  select id into home_id from public.categories where slug='home';
  select id into beauty_id from public.categories where slug='beauty';
  select id into urban_id from public.brands where slug='urban-co';
  select id into nova_id from public.brands where slug='novatech';
  select id into lumen_id from public.brands where slug='lumen';
  select id into pure_id from public.brands where slug='pure';
  select id into atlas_id from public.brands where slug='atlas';

  -- Products
  insert into public.products (name, slug, sku, short_description, description, price, sale_price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Classic Cotton T-Shirt', 'classic-cotton-tshirt', 'UC-TS-001', 'Soft everyday tee', 'A wardrobe staple made from 100% combed cotton with a relaxed fit.', 1499, 999, fashion_men_id, urban_id, true, true, false, '100% cotton;Relaxed fit;Pre-shrunk', '{"material":"cotton","fit":"relaxed"}', array['tshirt','cotton','men'], 4.5, 12)
  returning id into p1;
  insert into public.products (name, slug, sku, short_description, description, price, sale_price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Slim Fit Denim Jeans', 'slim-fit-denim-jeans', 'UC-DJ-002', 'Stretch denim jeans', 'Mid-rise slim jeans with stretch denim for all-day comfort.', 3999, 2999, fashion_men_id, urban_id, false, true, false, 'Stretch denim;Mid-rise;Slim fit', '{"material":"denim","fit":"slim"}', array['jeans','denim'], 4.2, 8)
  returning id into p2;
  insert into public.products (name, slug, sku, short_description, description, price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Floral Summer Dress', 'floral-summer-dress', 'UC-SD-003', 'Breezy floral dress', 'Lightweight floral dress perfect for warm days.', 4999, fashion_women_id, urban_id, true, false, true, 'Lightweight;Floral print;Knee length', '{"material":"polyester","fit":"regular"}', array['dress','floral','women'], 4.7, 5)
  returning id into p3;
  insert into public.products (name, slug, sku, short_description, description, price, sale_price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Wireless Noise-Cancelling Headphones', 'wireless-noise-cancelling-headphones', 'NT-HP-101', 'Immersive ANC headphones', 'Over-ear headphones with active noise cancellation and 30h battery life.', 18999, 14999, electronics_audio_id, nova_id, true, true, true, 'Active noise cancellation;30h battery;Bluetooth 5.3', '{"battery":"30h","connectivity":"bluetooth"}', array['headphones','audio','anc'], 4.8, 34)
  returning id into p4;
  insert into public.products (name, slug, sku, short_description, description, price, sale_price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('True Wireless Earbuds', 'true-wireless-earbuds', 'NT-EB-102', 'Compact earbuds', 'TWS earbuds with charging case and touch controls.', 7999, 5999, electronics_audio_id, nova_id, false, true, false, 'TWS;Touch controls;IPX5', '{"battery":"24h","connectivity":"bluetooth"}', array['earbuds','audio'], 4.4, 21)
  returning id into p5;
  insert into public.products (name, slug, sku, short_description, description, price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Smart Fitness Watch', 'smart-fitness-watch', 'NT-WT-103', 'Health tracking watch', 'Fitness watch with heart rate, SpO2 and 7-day battery.', 12999, electronics_id, nova_id, true, false, true, 'Heart rate;SpO2;7-day battery', '{"battery":"7d","water_resistance":"5ATM"}', array['watch','fitness'], 4.3, 15)
  returning id into p6;
  insert into public.products (name, slug, sku, short_description, description, price, sale_price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Modern Table Lamp', 'modern-table-lamp', 'LM-LP-201', 'Warm LED lamp', 'Minimalist table lamp with warm dimmable LED.', 3499, 2499, home_id, lumen_id, true, false, false, 'Dimmable;LED;Warm light', '{"wattage":"5W","color":"warm"}', array['lamp','home','light'], 4.6, 9)
  returning id into p7;
  insert into public.products (name, slug, sku, short_description, description, price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Aroma Diffuser', 'aroma-diffuser', 'LM-DF-202', 'Ultrasonic diffuser', 'Quiet ultrasonic aroma diffuser with ambient light.', 2999, home_id, lumen_id, false, true, true, 'Ultrasonic;Auto-off;Ambient light', '{"capacity":"300ml"}', array['diffuser','home'], 4.1, 6)
  returning id into p8;
  insert into public.products (name, slug, sku, short_description, description, price, sale_price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Vitamin C Serum', 'vitamin-c-serum', 'PU-SR-301', 'Brightening serum', 'Vitamin C serum for radiant, even-toned skin.', 2500, 1999, beauty_id, pure_id, true, true, true, '10% Vitamin C;Hydrating;Cruelty-free', '{"volume":"30ml"}', array['serum','beauty','skincare'], 4.9, 40)
  returning id into p9;
  insert into public.products (name, slug, sku, short_description, description, price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Hydrating Face Cream', 'hydrating-face-cream', 'PU-CR-302', 'Daily moisturizer', 'Lightweight face cream with hyaluronic acid.', 3200, beauty_id, pure_id, false, true, false, 'Hyaluronic acid;Non-greasy;24h hydration', '{"volume":"50ml"}', array['cream','beauty'], 4.5, 18)
  returning id into p10;
  insert into public.products (name, slug, sku, short_description, description, price, sale_price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Running Sneakers', 'running-sneakers', 'AT-SN-401', 'Lightweight running shoes', 'Breathable mesh running shoes with cushioned sole.', 6999, 4999, fashion_men_id, atlas_id, true, true, true, 'Breathable mesh;Cushioned;Lightweight', '{"material":"mesh","fit":"regular"}', array['shoes','running'], 4.4, 22)
  returning id into p11;
  insert into public.products (name, slug, sku, short_description, description, price, category_id, brand_id, is_featured, is_bestseller, is_new, features, specifications, tags, rating_avg, rating_count)
  values
    ('Leather Wallet', 'leather-wallet', 'AT-WL-402', 'Minimalist leather wallet', 'Genuine leather bifold wallet with RFID protection.', 2499, fashion_men_id, atlas_id, false, false, false, 'Genuine leather;RFID protection;Bifold', '{"material":"leather"}', array['wallet','accessories'], 4.6, 11)
  returning id into p12;

  -- Images
  insert into public.product_images (product_id, url, alt, sort_order) values
    (p1, 'https://images.unsplash.com/photo-1521572163474-6864f9b17a8c?w=800', 'Classic Cotton T-Shirt', 0),
    (p2, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 'Slim Fit Denim Jeans', 0),
    (p3, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', 'Floral Summer Dress', 0),
    (p4, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'Wireless Headphones', 0),
    (p5, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', 'True Wireless Earbuds', 0),
    (p6, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 'Smart Fitness Watch', 0),
    (p7, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 'Modern Table Lamp', 0),
    (p8, 'https://images.unsplash.com/photo-1608571423902-eed68a027bad?w=800', 'Aroma Diffuser', 0),
    (p9, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 'Vitamin C Serum', 0),
    (p10, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800', 'Hydrating Face Cream', 0),
    (p11, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 'Running Sneakers', 0),
    (p12, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', 'Leather Wallet', 0);

  -- Variants for apparel
  insert into public.product_variants (product_id, sku, size, color, color_hex, sort_order) values
    (p1, 'UC-TS-001-S-BLK', 'S', 'Black', '#111111', 0),
    (p1, 'UC-TS-001-M-BLK', 'M', 'Black', '#111111', 1),
    (p1, 'UC-TS-001-L-WHT', 'L', 'White', '#ffffff', 2),
    (p2, 'UC-DJ-002-30-BLU', '30', 'Blue', '#1e3a8a', 0),
    (p2, 'UC-DJ-002-32-BLU', '32', 'Blue', '#1e3a8a', 1),
    (p3, 'FL-SD-003-S-FLR', 'S', 'Floral', '#f472b6', 0),
    (p3, 'FL-SD-003-M-FLR', 'M', 'Floral', '#f472b6', 1),
    (p11, 'AT-SN-401-42-BLK', '42', 'Black', '#111111', 0),
    (p11, 'AT-SN-401-43-WHT', '43', 'White', '#ffffff', 1);

  -- Inventory per product (no variant)
  insert into public.inventory (product_id, stock_quantity, reserved_quantity, low_stock_threshold)
  select p.id, 50, 0, 5 from (values (p1),(p2),(p3),(p4),(p5),(p6),(p7),(p8),(p9),(p10),(p11),(p12)) as v(id) join (select id from public.products) p on p.id = v.id
  on conflict do nothing;

  -- Inventory for variants
  insert into public.inventory (product_id, variant_id, sku, stock_quantity, reserved_quantity, low_stock_threshold)
  select pv.product_id, pv.id, pv.sku, 20, 0, 3 from public.product_variants pv
  on conflict do nothing;

  -- Reviews
  insert into public.reviews (product_id, user_id, rating, title, body, is_verified_purchase, is_approved)
  select p4, auth.uid(), 5, 'Excellent sound', 'Best headphones I have owned. ANC is top notch.', true, true
  from public.products p where p.id = p4 and auth.uid() is not null
  on conflict do nothing;

end $$;

-- Coupons
insert into public.coupons (code, description, discount_type, value, min_order_amount, max_discount, is_active)
values
  ('WELCOME10', '10% off your first order', 'percentage', 10, 1000, 2000, true),
  ('FREESHIP', 'Free shipping on your order', 'fixed', 200, 0, 200, true)
on conflict (code) do nothing;

-- Shipping zones (Pakistan cities)
insert into public.shipping_zones (name, city, charge, free_shipping_threshold, estimated_days, is_active)
values
  ('Karachi', 'Karachi', 200, 5000, '2-3 days', true),
  ('Lahore', 'Lahore', 250, 5000, '2-4 days', true),
  ('Islamabad', 'Islamabad', 300, 5000, '3-5 days', true),
  ('Rawalpindi', 'Rawalpindi', 300, 5000, '3-5 days', true),
  ('Faisalabad', 'Faisalabad', 280, 5000, '3-5 days', true),
  ('Multan', 'Multan', 320, 5000, '3-6 days', true),
  ('Peshawar', 'Peshawar', 350, 5000, '4-6 days', true),
  ('Quetta', 'Quetta', 380, 5000, '4-7 days', true)
on conflict do nothing;
