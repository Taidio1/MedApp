-- supabase/app-settings-migration.sql
-- Run in Supabase SQL Editor

create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('require_login', 'true')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

-- Anon + authenticated mogą czytać ustawienia (potrzebne przed zalogowaniem)
create policy "app_settings_public_read"
  on public.app_settings for select
  to anon, authenticated
  using (true);

-- Tylko admin może zapisywać
create policy "app_settings_admin_write"
  on public.app_settings
  for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
