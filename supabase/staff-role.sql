-- Add role metadata to the existing staff table.
alter table public.staffs
add column if not exists email text;

alter table public.staffs
add column if not exists role text not null default 'staff';

alter table public.staffs
drop constraint if exists staffs_role_check;

-- Normalize existing values before enforcing the allowed roles.
update public.staffs
set role = 'staff'
where role is null or role not in ('owner', 'staff');

alter table public.staffs
add constraint staffs_role_check check (role in ('owner', 'staff'));

create unique index if not exists staffs_email_unique_idx
on public.staffs (lower(email))
where email is not null;

-- Let the owner manage staff rows while keeping staff users out of this table.
alter table public.staffs enable row level security;

-- INSERT needs sequence access for the auto-generated staff id.
grant usage, select on sequence public.staffs_id_seq to authenticated;

drop policy if exists "staffs_read_own_role" on public.staffs;
drop policy if exists "staffs_owner_select" on public.staffs;
drop policy if exists "staffs_owner_insert" on public.staffs;
drop policy if exists "staffs_owner_update" on public.staffs;
drop policy if exists "staffs_owner_delete" on public.staffs;

create or replace function public.is_staff_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.staffs
		where lower(email) = lower(auth.email())
			and role = 'owner'
	);
$$;

create policy "staffs_owner_select"
on public.staffs
for select
to authenticated
using (public.is_staff_owner());

create policy "staffs_owner_insert"
on public.staffs
for insert
to authenticated
with check (public.is_staff_owner());

create policy "staffs_owner_update"
on public.staffs
for update
to authenticated
using (public.is_staff_owner())
with check (public.is_staff_owner());

create policy "staffs_owner_delete"
on public.staffs
for delete
to authenticated
using (public.is_staff_owner());

-- After running this migration, replace the email below with the same
-- email used in Supabase Authentication > Users.
-- update public.staffs
-- set role = 'owner', email = 'owner@example.com'
-- where id = 1;
