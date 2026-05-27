-- Stripe Premium access patch.
-- Run this in Supabase SQL Editor after schema-v0.2.sql if the project already exists.

begin;

create or replace function public.is_premium_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.users
      where id = (select auth.uid())
        and role = 'premiumUser'
        and (premium_until is null or premium_until > now())
    ),
    false
  )
$$;

grant execute on function public.is_premium_or_admin() to anon, authenticated;

update public.anatomy_structures
set is_premium = true
where id = 'lung';

commit;
