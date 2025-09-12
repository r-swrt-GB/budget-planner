-- Fix month_year column length to accommodate longer descriptions
-- like "January - 2026" instead of just "2026-01"

ALTER TABLE public.budgets 
ALTER COLUMN month_year TYPE VARCHAR(50);

-- Update the unique constraint comment to reflect the new format
COMMENT ON COLUMN public.budgets.month_year IS 'Human-readable month/year format like "January - 2026" or "2024-01"';
