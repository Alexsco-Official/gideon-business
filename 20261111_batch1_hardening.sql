-- Batch 1 hardening for Gideon Business (applied 2026-11-11)

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and business_id = (select p.business_id from public.profiles p
                       where p.id = (select auth.uid()))
    and role = (select p.role from public.profiles p
                where p.id = (select auth.uid()))
  );

create or replace function public.protect_business_owner()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.owner_id is distinct from old.owner_id
     and (select auth.uid()) is not null then
    raise exception 'owner_id cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger businesses_protect_owner
  before update on public.businesses
  for each row execute function public.protect_business_owner();

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    role = 'user'
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and public.is_business_member(c.business_id)
    )
  );

alter table public.sales
  add constraint sales_total_matches_check
  check (abs(total - (subtotal - discount)) <= 0.005);

alter table public.sale_items
  add constraint sale_items_line_total_matches_check
  check (abs(line_total - quantity * unit_price) <= 0.005 + quantity * 0.005);
