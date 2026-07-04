-- Adds optional start date for task date ranges (start → due/end)

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS start_date DATE;

NOTIFY pgrst, 'reload schema';
