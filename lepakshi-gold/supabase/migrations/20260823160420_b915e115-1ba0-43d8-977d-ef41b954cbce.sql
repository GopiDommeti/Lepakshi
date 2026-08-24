
-- tighten helper functions
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_staff(uuid) from public, anon;

create type public.payment_method as enum ('cod','razorpay','upi','bank_transfer');
create type public.payment_status as enum ('pending','paid','failed','refunded','partially_refunded');
create type public.order_status as enum ('pending','processing','packed','shipped','out_for_delivery','delivered','cancelled','refunded','failed','on_hold');
create type public.coupon_type as enum ('percent','fixed_cart','fixed_product','free_shipping');
create type public.coupon_applies as enum ('all','products','categories');
create type public.zone_match as enum ('pincode','district','state','rest');
create type public.shipping_method_type as enum ('flat','free_above','weight_based','pickup');
create type public.review_status as enum ('pending','approved','rejected');
create type public.notify_channel as enum ('email','whatsapp','sms');

-- ===== CUSTOMER DATA =====
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  type public.address_type not null default 'shipping',
  label text, full_name text, phone text,
  line1 text, line2 text, landmark text, city text, district text,
  state text default 'Andhra Pradesh', pincode text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

-- ===== ORDERS =====
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  is_guest boolean not null default false,
  contact_name text, contact_phone text, contact_email text,
  shipping_address jsonb, billing_address jsonb,
  items_subtotal numeric not null default 0,
  discount_total numeric not null default 0,
  coupon_code text,
  shipping_total numeric not null default 0,
  tax_total numeric not null default 0,
  grand_total numeric not null default 0,
  payment_method public.payment_method not null default 'cod',
  payment_status public.payment_status not null default 'pending',
  payment_ref text,
  status public.order_status not null default 'pending',
  courier_name text, tracking_number text, tracking_url text,
  customer_note text,
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variation_id uuid references public.variations(id) on delete set null,
  product_name_snapshot text, variation_label_snapshot text, sku_snapshot text,
  image_snapshot text,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  cost_price_snapshot numeric not null default 0,
  gst_rate numeric not null default 5,
  line_total numeric not null default 0
);
create table public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  note text not null,
  is_customer_visible boolean not null default false,
  created_by uuid, created_at timestamptz not null default now()
);
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid, changed_at timestamptz not null default now()
);
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric not null, reason text, restock boolean not null default false,
  refunded_by uuid, created_at timestamptz not null default now()
);
create index on public.order_items (order_id);
create index on public.orders (customer_id);
create trigger t_orders_upd before update on public.orders for each row execute function public.set_updated_at();

-- ===== MARKETING =====
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, description text,
  type public.coupon_type not null default 'percent',
  value numeric not null default 0,
  min_spend numeric, max_discount numeric,
  usage_limit int, usage_limit_per_customer int, used_count int not null default 0,
  applies_to public.coupon_applies not null default 'all',
  product_ids uuid[] not null default '{}',
  category_ids uuid[] not null default '{}',
  excluded_ids uuid[] not null default '{}',
  first_order_only boolean not null default false,
  starts_at timestamptz, expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid, amount numeric not null default 0,
  used_at timestamptz not null default now()
);

-- ===== SHIPPING & TAX =====
create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null, match_type public.zone_match not null default 'rest',
  values text[] not null default '{}', sort_order int not null default 0,
  is_active boolean not null default true
);
create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  name text not null, type public.shipping_method_type not null default 'flat',
  cost numeric not null default 0, free_above numeric, per_kg_rate numeric,
  min_days int, max_days int, is_active boolean not null default true
);
create table public.pincode_serviceability (
  id uuid primary key default gen_random_uuid(),
  pincode text not null unique,
  is_serviceable boolean not null default true,
  cod_available boolean not null default true,
  eta_days int not null default 4,
  city text, district text, state text
);

-- ===== CONTENT =====
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, title text not null,
  content jsonb not null default '[]'::jsonb,
  seo_title text, seo_description text,
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, data jsonb not null default '{}'::jsonb,
  is_active boolean not null default true, sort_order int not null default 0
);
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text, subtitle text, image_url text, mobile_image_url text, link_url text,
  placement text, sort_order int not null default 0,
  starts_at timestamptz, ends_at timestamptz, is_active boolean not null default true
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text, body text, images jsonb not null default '[]'::jsonb,
  author_name text, author_town text,
  is_verified_purchase boolean not null default false,
  status public.review_status not null default 'pending',
  reply text,
  created_at timestamptz not null default now()
);
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null, answer text not null, category text,
  sort_order int not null default 0, is_active boolean not null default true
);
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text, email text, type text, message text,
  created_at timestamptz not null default now()
);

-- ===== OPS =====
create table public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null, filename text, alt_text text, folder text,
  size_bytes bigint, uploaded_by uuid, created_at timestamptz not null default now()
);
create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  channel public.notify_channel not null, template text, recipient text,
  order_id uuid references public.orders(id) on delete set null,
  status text, error text, sent_at timestamptz not null default now()
);
create table public.settings (
  id boolean primary key default true check (id),
  store_name text default 'Lepakshi Gold',
  legal_name text default 'Venkateshwara Oil Traders',
  address text, phone text, whatsapp text, email text,
  gstin text, fssai_no text, logo_url text, favicon_url text,
  order_prefix text default 'LG', next_order_number int default 1,
  currency text default 'INR', prices_include_tax boolean default true,
  free_shipping_above numeric, default_shipping_fee numeric default 60,
  cod_enabled boolean default true, cod_extra_fee numeric default 0,
  razorpay_enabled boolean default false,
  low_stock_alert_email text, order_email_recipients text[] default '{}',
  social_links jsonb default '{}'::jsonb, seo_defaults jsonb default '{}'::jsonb,
  maintenance_mode boolean default false,
  updated_at timestamptz not null default now()
);

-- ===== GRANTS =====
grant select, insert, update, delete on
  public.addresses, public.wishlists, public.orders, public.order_items,
  public.order_notes, public.order_status_history, public.refunds,
  public.coupons, public.coupon_usages, public.shipping_zones, public.shipping_methods,
  public.pincode_serviceability, public.pages, public.content_blocks, public.banners,
  public.reviews, public.faqs, public.enquiries, public.media,
  public.notifications_log, public.settings to authenticated;
grant select on public.pages, public.content_blocks, public.banners, public.reviews,
  public.faqs, public.shipping_zones, public.shipping_methods,
  public.pincode_serviceability, public.settings to anon;
grant insert on public.enquiries to anon;
grant all on public.addresses, public.wishlists, public.orders, public.order_items,
  public.order_notes, public.order_status_history, public.refunds,
  public.coupons, public.coupon_usages, public.shipping_zones, public.shipping_methods,
  public.pincode_serviceability, public.pages, public.content_blocks, public.banners,
  public.reviews, public.faqs, public.enquiries, public.media,
  public.notifications_log, public.settings to service_role;

-- ===== RLS =====
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_notes enable row level security;
alter table public.order_status_history enable row level security;
alter table public.refunds enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_usages enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.pincode_serviceability enable row level security;
alter table public.pages enable row level security;
alter table public.content_blocks enable row level security;
alter table public.banners enable row level security;
alter table public.reviews enable row level security;
alter table public.faqs enable row level security;
alter table public.enquiries enable row level security;
alter table public.media enable row level security;
alter table public.notifications_log enable row level security;
alter table public.settings enable row level security;

create policy "own addresses" on public.addresses for all to authenticated
  using (customer_id = auth.uid() or public.is_staff(auth.uid()))
  with check (customer_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own wishlist" on public.wishlists for all to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "orders read" on public.orders for select to authenticated
  using (customer_id = auth.uid() or public.is_staff(auth.uid()));
create policy "orders staff write" on public.orders for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "order items read" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.customer_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "order items staff write" on public.order_items for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "order notes staff" on public.order_notes for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "order notes customer read" on public.order_notes for select to authenticated
  using (is_customer_visible and exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "history read" on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.customer_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "history staff write" on public.order_status_history for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "refunds staff" on public.refunds for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "coupons staff" on public.coupons for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "coupon usage staff" on public.coupon_usages for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "zones public read" on public.shipping_zones for select using (true);
create policy "zones staff" on public.shipping_zones for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "methods public read" on public.shipping_methods for select using (true);
create policy "methods staff" on public.shipping_methods for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "pincode public read" on public.pincode_serviceability for select using (true);
create policy "pincode staff" on public.pincode_serviceability for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "pages public read" on public.pages for select using (is_published or public.is_staff(auth.uid()));
create policy "pages staff" on public.pages for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "blocks public read" on public.content_blocks for select using (true);
create policy "blocks staff" on public.content_blocks for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "banners public read" on public.banners for select using (is_active or public.is_staff(auth.uid()));
create policy "banners staff" on public.banners for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "reviews public read" on public.reviews for select
  using (status = 'approved' or customer_id = auth.uid() or public.is_staff(auth.uid()));
create policy "reviews customer insert" on public.reviews for insert to authenticated
  with check (customer_id = auth.uid());
create policy "reviews staff" on public.reviews for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "faqs public read" on public.faqs for select using (is_active or public.is_staff(auth.uid()));
create policy "faqs staff" on public.faqs for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "enquiries anyone insert" on public.enquiries for insert with check (true);
create policy "enquiries staff read" on public.enquiries for select to authenticated
  using (public.is_staff(auth.uid()));

create policy "media staff" on public.media for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "notif staff" on public.notifications_log for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "settings public read" on public.settings for select using (true);
create policy "settings owner write" on public.settings for all to authenticated
  using (public.has_role(auth.uid(),'owner')) with check (public.has_role(auth.uid(),'owner'));

insert into public.settings (id) values (true) on conflict do nothing;
