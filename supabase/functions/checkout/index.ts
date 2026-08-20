import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return json({ error: "Cart is empty" }, 400);
    }
    if (!shippingAddress) return json({ error: "Shipping address required" }, 400);
    if (!paymentMethod) return json({ error: "Payment method required" }, 400);

    // Fetch products and inventory from DB (never trust frontend prices)
    const productIds = items.map((i: { product_id: string }) => i.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, price, sale_price, sku, product_images(url)")
      .in("id", productIds);

    const { data: inventories } = await supabase
      .from("inventory")
      .select("id, product_id, variant_id, stock_quantity, reserved_quantity")
      .in("product_id", productIds);

    // Validate stock and build order items with real prices
    let subtotal = 0;
    const orderItems: Record<string, unknown>[] = [];
    for (const item of items) {
      const product = (products as Record<string, unknown>[] | null)?.find((p) => p.id === item.product_id);
      if (!product) return json({ error: `Product not found: ${item.product_id}` }, 400);

      const price = (product.sale_price as number && (product.sale_price as number) < (product.price as number))
        ? (product.sale_price as number)
        : (product.price as number);

      const inv = (inventories as Record<string, unknown>[] | null)?.find(
        (i) => i.product_id === item.product_id && (!item.variant_id || i.variant_id === item.variant_id)
      );
      const available = inv ? (inv.stock_quantity as number) - (inv.reserved_quantity as number) : 0;
      if (item.quantity > available) {
        return json({ error: `Insufficient stock for ${product.name as string}` }, 400);
      }

      subtotal += price * item.quantity;
      const img = (product.product_images as Record<string, unknown>[] | null)?.[0]?.url as string | undefined;
      orderItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        product_name: product.name,
        variant_name: item.variant_name ?? null,
        sku: product.sku,
        price,
        quantity: item.quantity,
        image_url: img ?? null,
      });

      // Reserve inventory
      if (inv) {
        await supabase
          .from("inventory")
          .update({ reserved_quantity: (inv.reserved_quantity as number) + item.quantity })
          .eq("id", inv.id as string);
      }
    }

    // Shipping cost based on city
    let shippingCost = 250;
    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("charge, free_shipping_threshold")
      .eq("city", shippingAddress.city)
      .eq("is_active", true)
      .maybeSingle();
    if (zone) {
      shippingCost = (zone as Record<string, number>).charge;
      if ((zone as Record<string, number | null>).free_shipping_threshold && subtotal >= (zone as Record<string, number>).free_shipping_threshold!) {
        shippingCost = 0;
      }
    }

    // Coupon
    let discount = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .eq("is_active", true)
        .maybeSingle();
      if (coupon) {
        const c = coupon as Record<string, unknown>;
        if (c.discount_type === "percentage") {
          discount = (subtotal * (c.value as number)) / 100;
          if (c.max_discount) discount = Math.min(discount, c.max_discount as number);
        } else {
          discount = c.value as number;
        }
        if (c.min_order_amount && subtotal < (c.min_order_amount as number)) {
          discount = 0;
        } else {
          couponId = c.id as string;
        }
      }
    }

    const tax = Math.round(subtotal * 0.0);
    const total = subtotal - discount + shippingCost + tax;

    // Create order
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    const paymentStatus = paymentMethod === "cod" ? "cod" : "pending";
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: "pending",
        subtotal,
        discount,
        shipping_cost: shippingCost,
        tax,
        total,
        shipping_address: shippingAddress,
        billing_address: billingAddress ?? shippingAddress,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        coupon_id: couponId,
        coupon_code: couponCode ?? null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return json({ error: "Could not create order" }, 500);
    }

    // Insert order items
    await supabase.from("order_items").insert(
      orderItems.map((oi) => ({ ...oi, order_id: order.id }))
    );

    // Create payment record
    await supabase.from("payments").insert({
      order_id: order.id,
      method: paymentMethod,
      status: paymentStatus,
      amount: total,
    });

    // Decrease actual stock (move from reserved to sold)
    for (const item of items) {
      const inv = (inventories as Record<string, unknown>[] | null)?.find(
        (i) => i.product_id === item.product_id && (!item.variant_id || i.variant_id === item.variant_id)
      );
      if (inv) {
        await supabase
          .from("inventory")
          .update({
            stock_quantity: (inv.stock_quantity as number) - item.quantity,
            reserved_quantity: Math.max(0, (inv.reserved_quantity as number) - item.quantity),
          })
          .eq("id", inv.id as string);
      }
    }

    // Record coupon usage
    if (couponId) {
      await supabase.from("coupon_usages").insert({ coupon_id: couponId, user_id: user.id, order_id: order.id });
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("cart_id", supabase.from("carts").select("id").eq("user_id", user.id));

    // Notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "order_confirmation",
      title: `Order ${orderNumber} confirmed`,
      body: `Thank you for your order! Your total is PKR ${total.toLocaleString()}.`,
    });

    return json({ orderId: order.id, orderNumber, total }, 200);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
