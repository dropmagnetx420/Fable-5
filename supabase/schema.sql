-- ============================================================================
--  SITOL CHAYA — Supabase schema, RLS policies, storage & triggers
--  Run this whole file once in the Supabase SQL Editor (Dashboard → SQL).
--  Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto (enabled by default on Supabase).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

-- Member profiles, 1:1 with auth.users.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'member' check (role in ('manager', 'member')),
  created_at  timestamptz not null default now()
);

-- Bazaar / expense entries. Anyone can add; only the manager may soft-delete.
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references public.profiles (id) on delete restrict,
  amount      numeric(12, 2) not null check (amount >= 0),
  description text,
  category    text not null default 'others'
              check (category in ('grocery', 'vegetables', 'meat', 'others')),
  spent_on    date not null default current_date,
  is_deleted  boolean not null default false,
  deleted_by  uuid references public.profiles (id),
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Photos attached to an expense. IMMUTABLE: no update/delete policies exist,
-- so once uploaded a photo can never be edited or removed by anyone.
create table if not exists public.expense_photos (
  id           uuid primary key default gen_random_uuid(),
  expense_id   uuid not null references public.expenses (id) on delete cascade,
  storage_path text not null,
  public_url   text not null,
  uploaded_by  uuid not null references public.profiles (id),
  created_at   timestamptz not null default now()
);

-- Daily meal counts per member (manager-managed). One row per member per day.
create table if not exists public.meal_entries (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.profiles (id) on delete cascade,
  entry_date  date not null,
  meal_count  integer not null default 0 check (meal_count >= 0),
  recorded_by uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (member_id, entry_date)
);

-- Money each member deposits into the mess pot (manager-recorded, all view).
create table if not exists public.deposits (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.profiles (id) on delete cascade,
  amount       numeric(12, 2) not null check (amount > 0),
  deposit_date date not null default current_date,
  note         text,
  recorded_by  uuid references public.profiles (id),
  created_at   timestamptz not null default now()
);

-- Frozen monthly settlement snapshots. Kept forever for history.
create table if not exists public.monthly_settlements (
  id            uuid primary key default gen_random_uuid(),
  month         text not null unique,             -- 'YYYY-MM'
  total_expense numeric(12, 2) not null default 0,
  total_meals   integer not null default 0,
  per_meal_cost numeric(12, 4) not null default 0,
  breakdown     jsonb not null default '[]'::jsonb,
  is_settled    boolean not null default false,
  generated_by  uuid references public.profiles (id),
  generated_at  timestamptz not null default now()
);

-- In-app notifications (new expense, settlement generated, etc.).
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null default 'system'
             check (type in ('expense', 'settlement', 'meal', 'system')),
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_expenses_spent_on on public.expenses (spent_on desc);
create index if not exists idx_expenses_created_by on public.expenses (created_by);
create index if not exists idx_expenses_not_deleted on public.expenses (is_deleted);
create index if not exists idx_photos_expense on public.expense_photos (expense_id);
create index if not exists idx_meals_date on public.meal_entries (entry_date);
create index if not exists idx_meals_member on public.meal_entries (member_id);
create index if not exists idx_deposits_date on public.deposits (deposit_date desc);
create index if not exists idx_deposits_member on public.deposits (member_id);
create index if not exists idx_notif_user on public.notifications (user_id, is_read);

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS  (SECURITY DEFINER → bypass RLS, avoid recursion)
-- ----------------------------------------------------------------------------

create or replace function public.is_manager(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'manager'
  );
$$;

-- Auto-create a profile when a user signs up.
-- The FIRST ever user becomes the manager; everyone after is a member.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_manager boolean;
begin
  select exists (select 1 from public.profiles where role = 'manager')
    into has_manager;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    case when has_manager then 'member' else 'manager' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Notify every other member when a new expense is added.
create or replace function public.notify_on_expense()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
begin
  select coalesce(full_name, 'Someone') into actor_name
  from public.profiles where id = new.created_by;

  insert into public.notifications (user_id, type, title, body, link)
  select p.id,
         'expense',
         'New expense added',
         actor_name || ' added ৳' || trim(to_char(new.amount, 'FM999999990.00'))
           || coalesce(' — ' || new.description, ''),
         '/expenses'
  from public.profiles p
  where p.id <> new.created_by;

  return new;
end;
$$;

drop trigger if exists on_expense_created on public.expenses;
create trigger on_expense_created
  after insert on public.expenses
  for each row execute function public.notify_on_expense();

-- Keep meal_entries.updated_at fresh.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meal_entries_set_updated_at on public.meal_entries;
create trigger meal_entries_set_updated_at
  before update on public.meal_entries
  for each row execute function public.set_updated_at();

-- Lock down role changes: a member must NOT be able to promote themselves.
-- Only a service-role request (the /foisal admin panel) may change role.
-- Name/phone/avatar edits leave role unchanged, so they still pass.
create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role can only be changed via the admin panel';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_change on public.profiles;
create trigger prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_unauthorized_role_change();

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.expenses            enable row level security;
alter table public.expense_photos      enable row level security;
alter table public.meal_entries        enable row level security;
alter table public.deposits            enable row level security;
alter table public.monthly_settlements enable row level security;
alter table public.notifications       enable row level security;

-- profiles --------------------------------------------------------------
drop policy if exists "profiles are viewable by members" on public.profiles;
create policy "profiles are viewable by members"
  on public.profiles for select to authenticated using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "manager updates any profile" on public.profiles;
create policy "manager updates any profile"
  on public.profiles for update to authenticated
  using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

-- expenses --------------------------------------------------------------
drop policy if exists "expenses viewable by members" on public.expenses;
create policy "expenses viewable by members"
  on public.expenses for select to authenticated using (true);

drop policy if exists "members add own expense" on public.expenses;
create policy "members add own expense"
  on public.expenses for insert to authenticated
  with check (auth.uid() = created_by);

-- Only the manager may modify (i.e. soft-delete) an expense.
drop policy if exists "manager updates expense" on public.expenses;
create policy "manager updates expense"
  on public.expenses for update to authenticated
  using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

-- expense_photos  (insert only → immutable) -----------------------------
drop policy if exists "photos viewable by members" on public.expense_photos;
create policy "photos viewable by members"
  on public.expense_photos for select to authenticated using (true);

drop policy if exists "members add photos to live expense" on public.expense_photos;
create policy "members add photos to live expense"
  on public.expense_photos for insert to authenticated
  with check (
    auth.uid() = uploaded_by
    and exists (
      select 1 from public.expenses e
      where e.id = expense_id and e.is_deleted = false
    )
  );
-- NOTE: intentionally NO update/delete policies → photos are permanent.

-- meal_entries  (manager only writes) -----------------------------------
drop policy if exists "meals viewable by members" on public.meal_entries;
create policy "meals viewable by members"
  on public.meal_entries for select to authenticated using (true);

drop policy if exists "manager inserts meals" on public.meal_entries;
create policy "manager inserts meals"
  on public.meal_entries for insert to authenticated
  with check (public.is_manager(auth.uid()));

drop policy if exists "manager updates meals" on public.meal_entries;
create policy "manager updates meals"
  on public.meal_entries for update to authenticated
  using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

drop policy if exists "manager deletes meals" on public.meal_entries;
create policy "manager deletes meals"
  on public.meal_entries for delete to authenticated
  using (public.is_manager(auth.uid()));

-- deposits  (manager only writes; everyone views) -----------------------
drop policy if exists "deposits viewable by members" on public.deposits;
create policy "deposits viewable by members"
  on public.deposits for select to authenticated using (true);

drop policy if exists "manager inserts deposit" on public.deposits;
create policy "manager inserts deposit"
  on public.deposits for insert to authenticated
  with check (public.is_manager(auth.uid()));

drop policy if exists "manager updates deposit" on public.deposits;
create policy "manager updates deposit"
  on public.deposits for update to authenticated
  using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

drop policy if exists "manager deletes deposit" on public.deposits;
create policy "manager deletes deposit"
  on public.deposits for delete to authenticated
  using (public.is_manager(auth.uid()));

-- monthly_settlements  (manager only writes) ----------------------------
drop policy if exists "settlements viewable by members" on public.monthly_settlements;
create policy "settlements viewable by members"
  on public.monthly_settlements for select to authenticated using (true);

drop policy if exists "manager inserts settlement" on public.monthly_settlements;
create policy "manager inserts settlement"
  on public.monthly_settlements for insert to authenticated
  with check (public.is_manager(auth.uid()));

drop policy if exists "manager updates settlement" on public.monthly_settlements;
create policy "manager updates settlement"
  on public.monthly_settlements for update to authenticated
  using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));

-- notifications  (recipients see/manage their own) ----------------------
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications"
  on public.notifications for delete to authenticated
  using (auth.uid() = user_id);

-- Manager may broadcast notifications (e.g. settlement generated).
drop policy if exists "manager broadcasts notifications" on public.notifications;
create policy "manager broadcasts notifications"
  on public.notifications for insert to authenticated
  with check (public.is_manager(auth.uid()) or auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. STORAGE  (expense photo bucket — public read, insert only)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('expense-photos', 'expense-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read expense photos" on storage.objects;
create policy "public read expense photos"
  on storage.objects for select
  using (bucket_id = 'expense-photos');

drop policy if exists "members upload expense photos" on storage.objects;
create policy "members upload expense photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'expense-photos');
-- NOTE: no update/delete policies on storage.objects for this bucket → the
-- underlying image files are also permanent, matching the app rule.

-- Avatars bucket — public read; each user manages files under their own uid/.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- 5. REALTIME  (broadcast row changes to subscribed clients)
-- ----------------------------------------------------------------------------

do $$
begin
  begin execute 'alter publication supabase_realtime add table public.expenses'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.expense_photos'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.meal_entries'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.deposits'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.monthly_settlements'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.notifications'; exception when duplicate_object then null; end;
end $$;

-- Done. See README.md for the rest of the setup.
