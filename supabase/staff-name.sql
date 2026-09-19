-- Add a display name for owner staff management.
alter table public.staffs
add column if not exists name text;
