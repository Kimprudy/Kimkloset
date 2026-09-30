-- =============================================================
-- KIMKLOSET — DATABASE SCHEMA + ROW LEVEL SECURITY
-- Run this FIRST in Supabase → SQL Editor → New query → Run
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 1. PROFILES (one row per signed-up user)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile whenever someone signs up (email or Google)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- 2. PRODUCTS (prices are whole Naira, e.g. 45000 = ₦45,000)
-- -------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text not null default '',
  price        integer not null check (price > 0),
  category     text not null,
  sizes        text[] not null default '{}',
  colors       text[] not null default '{}',
  image_url    text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 3. CART ITEMS (tied to the logged-in user, so the cart persists)
-- -------------------------------------------------------------
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  size        text not null default '',
  color       text not null default '',
  quantity    integer not null default 1 check (quantity between 1 and 20),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, product_id, size, color)
);
create index if not exists cart_items_user_idx on public.cart_items(user_id);

-- -------------------------------------------------------------
-- 4. ORDERS (status + payment status live here)
-- -------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,
  user_id            uuid not null references auth.users(id) on delete cascade,
  status             text not null default 'pending'
                     check (status in ('pending', 'paid', 'failed', 'cancelled')),
  payment_provider   text not null default 'paystack',
  payment_reference  text not null unique,
  subtotal           integer not null,
  shipping_fee       integer not null default 0,
  total              integer not null,
  currency           text not null default 'NGN',
  customer_name      text not null,
  customer_email     text not null,
  customer_phone     text not null,
  shipping_address   text not null,
  city               text not null,
  state              text not null,
  paid_at            timestamptz,
  email_sent_at      timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);

-- -------------------------------------------------------------
-- 5. ORDER ITEMS (a snapshot of what was bought, at the price paid)
-- -------------------------------------------------------------
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,
  product_name   text not null,
  product_image  text,
  size           text not null default '',
  color          text not null default '',
  unit_price     integer not null,
  quantity       integer not null check (quantity > 0),
  line_total     integer not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- =============================================================
-- ROW LEVEL SECURITY
-- Users can only ever see/change THEIR OWN profile, cart and orders.
-- Orders are created/updated only by the server (service role key),
-- so a user can never mark their own order as "paid".
-- =============================================================
alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Profiles
drop policy if exists "Profiles: read own"   on public.profiles;
drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: read own"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Profiles: update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Products: anyone (even visitors) can browse active products
drop policy if exists "Products: public read" on public.products;
create policy "Products: public read" on public.products for select to anon, authenticated using (is_active = true);

-- Cart: full control over own rows only
drop policy if exists "Cart: select own" on public.cart_items;
drop policy if exists "Cart: insert own" on public.cart_items;
drop policy if exists "Cart: update own" on public.cart_items;
drop policy if exists "Cart: delete own" on public.cart_items;
create policy "Cart: select own" on public.cart_items for select to authenticated using (auth.uid() = user_id);
create policy "Cart: insert own" on public.cart_items for insert to authenticated with check (auth.uid() = user_id);
create policy "Cart: update own" on public.cart_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Cart: delete own" on public.cart_items for delete to authenticated using (auth.uid() = user_id);

-- Orders: read own only (no insert/update policy = only the server can write)
drop policy if exists "Orders: read own" on public.orders;
create policy "Orders: read own" on public.orders for select to authenticated using (auth.uid() = user_id);

-- Order items: read items that belong to your own orders
drop policy if exists "Order items: read own" on public.order_items;
create policy "Order items: read own" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
