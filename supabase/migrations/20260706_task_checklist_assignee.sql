-- Add assignee to task checklist items

ALTER TABLE public.task_checklist_items
  ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
