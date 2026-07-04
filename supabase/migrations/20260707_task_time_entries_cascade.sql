-- Remove orphaned time entries when a task is deleted

ALTER TABLE public.time_entries
  DROP CONSTRAINT IF EXISTS time_entries_task_id_fkey;

ALTER TABLE public.time_entries
  ADD CONSTRAINT time_entries_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
