
-- ===== ENUMS =====
create type public.app_role as enum ('owner','manager','staff');
create type public.attr_display as enum ('pills','dropdown','swatch');
create type public.product_type as enum ('simple','variable');
create type public.product_status as enum ('draft','published','archived');
create type public.backorder_mode as enum ('no','notify','allow');
create type public.movement_type as enum ('purchase','production','sale','return','damage','adjustment','cancellation');
create type public.address_type as enum ('shipping','billing');

-- ===== UTIL =====
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ===== PROFILES / ROLES =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
    where user_id = _user_id and role = _role and is_active);
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and is_active);
$$;

create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile write" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "roles readable by self and staff" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== CATALOGUE =====
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  name_te text,
  slug text not null unique,
  description text,
  image_url text,
  banner_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.attributes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_type public.attr_display not null default 'pills',
  sort_order int not null default 0
);

create table public.attribute_terms (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  unique (attribute_id, slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_te text,
  slug text not null unique,
  sku_base text,
  type public.product_type not null default 'variable',
  category_id uuid references public.categories(id) on delete set null,
  short_description text,
  description text,
  thumbnail_url text,
  gallery jsonb not null default '[]'::jsonb,
  gst_rate numeric not null default 5,
  hsn_code text,
  is_ganuga boolean not null default false,
  extraction text,
  shelf_life text,
  ingredients text,
  storage text,
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  upsell_ids uuid[] not null default '{}',
  crosssell_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (product_id, tag_id)
);

create table public.product_attributes (
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  used_for_variations boolean not null default true,
  sort_order int not null default 0,
  primary key (product_id, attribute_id)
);

create table public.product_attribute_terms (
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  term_id uuid not null references public.attribute_terms(id) on delete cascade,
  primary key (product_id, term_id)
);

create table public.variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  barcode text unique,
  option_map jsonb not null default '{}'::jsonb,
  label text,
  price numeric not null default 0,
  sale_price numeric,
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  cost_price numeric not null default 0,
  weight_grams int not null default 0,
  length_cm numeric, width_cm numeric, height_cm numeric,
  manage_stock boolean not null default true,
  stock_quantity numeric not null default 0,
  low_stock_threshold numeric not null default 5,
  backorders public.backorder_mode not null default 'no',
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variation_id uuid not null references public.variations(id) on delete cascade,
  type public.movement_type not null,
  quantity numeric not null,
  balance_after numeric not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index on public.products (category_id);
create index on public.variations (product_id);
create index on public.inventory_movements (variation_id, created_at desc);

create trigger t_categories_upd before update on public.categories for each row execute function public.set_updated_at();
create trigger t_products_upd before update on public.products for each row execute function public.set_updated_at();
create trigger t_variations_upd before update on public.variations for each row execute function public.set_updated_at();

-- grants
grant select on public.categories, public.tags, public.attributes, public.attribute_terms,
  public.products, public.product_tags, public.product_attributes,
  public.product_attribute_terms to anon, authenticated;
grant insert, update, delete on public.categories, public.tags, public.attributes, public.attribute_terms,
  public.products, public.product_tags, public.product_attributes,
  public.product_attribute_terms, public.variations, public.inventory_movements to authenticated;
grant select on public.inventory_movements to authenticated;
grant all on public.categories, public.tags, public.attributes, public.attribute_terms,
  public.products, public.product_tags, public.product_attributes,
  public.product_attribute_terms, public.variations, public.inventory_movements to service_role;

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.attributes enable row level security;
alter table public.attribute_terms enable row level security;
alter table public.products enable row level security;
alter table public.product_tags enable row level security;
alter table public.product_attributes enable row level security;
alter table public.product_attribute_terms enable row level security;
alter table public.variations enable row level security;
alter table public.inventory_movements enable row level security;

create policy "public read categories" on public.categories for select using (is_active or public.is_staff(auth.uid()));
create policy "staff write categories" on public.categories for all to authenticated
  using (public.is_staff(auth.uid()) and not public.has_role(auth.uid(),'staff'))
  with check (public.is_staff(auth.uid()) and not public.has_role(auth.uid(),'staff'));

create policy "public read tags" on public.tags for select using (true);
create policy "staff write tags" on public.tags for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "public read attributes" on public.attributes for select using (true);
create policy "staff write attributes" on public.attributes for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "public read terms" on public.attribute_terms for select using (true);
create policy "staff write terms" on public.attribute_terms for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "public read products" on public.products for select
  using (status = 'published' or public.is_staff(auth.uid()));
create policy "staff write products" on public.products for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "public read product_tags" on public.product_tags for select using (true);
create policy "staff write product_tags" on public.product_tags for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "public read product_attributes" on public.product_attributes for select using (true);
create policy "staff write product_attributes" on public.product_attributes for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "public read product_attribute_terms" on public.product_attribute_terms for select using (true);
create policy "staff write pat" on public.product_attribute_terms for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- variations: base table readable only by owner (cost_price!). Public reads go through the view.
create policy "owner read variations" on public.variations for select to authenticated
  using (public.has_role(auth.uid(),'owner'));
create policy "staff write variations" on public.variations for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "staff read movements" on public.inventory_movements for select to authenticated
  using (public.is_staff(auth.uid()));
create policy "staff write movements" on public.inventory_movements for insert to authenticated
  with check (public.is_staff(auth.uid()));

-- cost-free view for everyone else
create view public.variations_public
with (security_invoker = off) as
select v.id, v.product_id, v.sku, v.barcode, v.option_map, v.label,
       v.price, v.sale_price, v.sale_starts_at, v.sale_ends_at,
       v.weight_grams, v.length_cm, v.width_cm, v.height_cm,
       v.manage_stock, v.stock_quantity, v.low_stock_threshold, v.backorders,
       v.image_url, v.is_active, v.sort_order, v.created_at, v.updated_at
from public.variations v
join public.products p on p.id = v.product_id
where p.status = 'published' or public.is_staff(auth.uid());
grant select on public.variations_public to anon, authenticated;

-- ===== STOCK RULE =====
create or replace function public.adjust_stock(
  _variation_id uuid,
  _type public.movement_type,
  _qty numeric,
  _reference_type text default null,
  _reference_id uuid default null,
  _note text default null
) returns numeric
language plpgsql security definer set search_path = public as $$
declare _balance numeric;
begin
  update public.variations
     set stock_quantity = stock_quantity + _qty
   where id = _variation_id
  returning stock_quantity into _balance;

  if _balance is null then
    raise exception 'Variation % not found', _variation_id;
  end if;

  insert into public.inventory_movements
    (variation_id, type, quantity, balance_after, reference_type, reference_id, note, created_by)
  values (_variation_id, _type, _qty, _balance, _reference_type, _reference_id, _note, auth.uid());

  return _balance;
end $$;
revoke all on function public.adjust_stock(uuid, public.movement_type, numeric, text, uuid, text) from public, anon;
grant execute on function public.adjust_stock(uuid, public.movement_type, numeric, text, uuid, text) to authenticated, service_role;
