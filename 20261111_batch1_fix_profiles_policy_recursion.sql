-- Fix: the profiles policy in the first file looped on itself (42P17).
-- Replaced with a simple policy plus a trigger (applied 2026-11-11).

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is not null
     and (new.role is distinct from old.role
          or new.business_id is distinct from old.business_id
          or new.id is distinct from old.id) then
    raise exception 'role and business cannot be changed here' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();
