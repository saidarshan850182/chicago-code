-- ============================================================
-- Chicago Code — Supabase database setup
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.
-- Safe to run once on a fresh project.
-- ============================================================

-- ---- Roles ----
do $$ begin
  create type staff_role as enum ('admin', 'manager', 'employee');
exception when duplicate_object then null; end $$;

-- ---- Staff profiles (linked to Supabase Auth users) ----
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  role       staff_role not null default 'employee',
  created_at timestamptz not null default now()
);

-- ---- Products ----
create table if not exists public.products (
  id         bigint generated always as identity primary key,
  name       text not null,
  cat        text not null,                 -- tees | hoodies | outerwear | accessories
  category   text not null,                 -- display label
  price      numeric not null default 0,
  stock      integer not null default 0,
  badge      text,
  color      text not null default '#d6233c',
  image_url  text,
  sort       integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---- Helper: current user's role (security definer avoids RLS recursion) ----
create or replace function public.current_staff_role()
returns staff_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.products enable row level security;
alter table public.profiles enable row level security;

-- ---- PRODUCTS ----
-- Anyone (including the public storefront) can read.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (true);

-- Any signed-in staff member can add / edit / delete products.
drop policy if exists "products_staff_insert" on public.products;
create policy "products_staff_insert" on public.products
  for insert to authenticated
  with check (public.current_staff_role() is not null);

drop policy if exists "products_staff_update" on public.products;
create policy "products_staff_update" on public.products
  for update to authenticated
  using (public.current_staff_role() is not null)
  with check (public.current_staff_role() is not null);

drop policy if exists "products_staff_delete" on public.products;
create policy "products_staff_delete" on public.products
  for delete to authenticated
  using (public.current_staff_role() is not null);

-- ---- PROFILES (staff) ----
-- A user can always read their own profile (needed to learn their role at login).
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Staff can read the whole staff list (for the staff-management screen).
drop policy if exists "profiles_read_all_staff" on public.profiles;
create policy "profiles_read_all_staff" on public.profiles
  for select to authenticated
  using (public.current_staff_role() is not null);

-- Admin can add anyone; a manager can add staff but NOT another admin.
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert to authenticated
  with check (
    public.current_staff_role() = 'admin'
    or (public.current_staff_role() = 'manager' and role <> 'admin')
  );

-- Admin can edit any staff row.
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.current_staff_role() = 'admin')
  with check (true);

-- Manager can edit non-admin staff, and cannot promote anyone to admin.
drop policy if exists "profiles_update_manager" on public.profiles;
create policy "profiles_update_manager" on public.profiles
  for update to authenticated
  using (public.current_staff_role() = 'manager' and role <> 'admin')
  with check (role <> 'admin');

-- Admin can remove anyone; manager can remove non-admin staff.
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (public.current_staff_role() = 'admin');

drop policy if exists "profiles_delete_manager" on public.profiles;
create policy "profiles_delete_manager" on public.profiles
  for delete to authenticated
  using (public.current_staff_role() = 'manager' and role <> 'admin');

-- ============================================================
-- Storage: product images bucket (public read, staff write)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_staff_insert" on storage.objects;
create policy "product_images_staff_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.current_staff_role() is not null);

drop policy if exists "product_images_staff_update" on storage.objects;
create policy "product_images_staff_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.current_staff_role() is not null);

drop policy if exists "product_images_staff_delete" on storage.objects;
create policy "product_images_staff_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.current_staff_role() is not null);

-- ============================================================
-- Seed the starting product catalog (runs once; skip if products exist)
-- ============================================================
insert into public.products (name, cat, category, price, stock, badge, color, sort)
select * from (values
  ('Wrigley Box Tee',      'tees',        'Tees',        38::numeric,  24, 'New',     '#d6233c', 1),
  ('The Loop Heavy Tee',   'tees',        'Tees',        42::numeric,  18, null,      '#2a2a31', 2),
  ('Lakefront Pocket Tee', 'tees',        'Tees',        40::numeric,  12, null,      '#41b6e6', 3),
  ('Lake Effect Hoodie',   'hoodies',     'Hoodies',     78::numeric,  9,  'Best',    '#1b4965', 4),
  ('Pilsen Press Hoodie',  'hoodies',     'Hoodies',     82::numeric,  7,  null,      '#d6233c', 5),
  ('Second City Crewneck', 'hoodies',     'Hoodies',     68::numeric,  15, null,      '#555555', 6),
  ('Windy City Parka',     'outerwear',   'Outerwear',   168::numeric, 5,  'Limited', '#0e0e0f', 7),
  ('Division St. Bomber',  'outerwear',   'Outerwear',   142::numeric, 6,  null,      '#1b4965', 8),
  ('Code Cuffed Beanie',   'accessories', 'Accessories', 28::numeric,  40, null,      '#d6233c', 9),
  ('Flag Stripe Socks',    'accessories', 'Accessories', 16::numeric,  50, null,      '#41b6e6', 10),
  ('CC Snapback Cap',      'accessories', 'Accessories', 32::numeric,  22, 'New',     '#2a2a31', 11),
  ('Riverwalk Tote',       'accessories', 'Accessories', 24::numeric,  30, null,      '#555555', 12)
) as v(name, cat, category, price, stock, badge, color, sort)
where not exists (select 1 from public.products);

-- ============================================================
-- AFTER creating the admin auth user (see SETUP.md step 5),
-- run THIS to give that user the admin role:
--
--   insert into public.profiles (id, username, role)
--   select id, 'ChicagoCodeAdmin', 'admin'
--   from auth.users
--   where email = 'chicagocodeadmin@chicagocode.local'
--   on conflict (id) do update set role = 'admin', username = 'ChicagoCodeAdmin';
-- ============================================================
