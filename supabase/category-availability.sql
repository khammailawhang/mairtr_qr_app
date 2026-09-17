-- Add category visibility control used by the Owner, staff, and customer pages.
alter table public.categories
  add column if not exists is_available boolean not null default true;

update public.categories
set is_available = true
where is_available is null;
