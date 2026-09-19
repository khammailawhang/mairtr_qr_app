-- Separate owner visibility from staff operational table status.
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;

UPDATE public.tables
SET is_available = true
WHERE is_available IS NULL;

-- Migrate the previous Owner-only disabled marker out of staff status.
UPDATE public.tables
SET is_available = false,
    status = 'vacant'
WHERE status = 'disabled';
