-- Task checklist items (inline checklists on tasks)

CREATE TABLE IF NOT EXISTS public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_checklist_items_task_id_idx
  ON public.task_checklist_items (task_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_checklist_items TO authenticated;
GRANT ALL ON public.task_checklist_items TO service_role;

ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task checklist visible to authenticated"
  ON public.task_checklist_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated create task checklist items"
  ON public.task_checklist_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update task checklist items"
  ON public.task_checklist_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete task checklist items"
  ON public.task_checklist_items FOR DELETE TO authenticated USING (true);

CREATE TRIGGER task_checklist_items_updated_at
  BEFORE UPDATE ON public.task_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

NOTIFY pgrst, 'reload schema';
