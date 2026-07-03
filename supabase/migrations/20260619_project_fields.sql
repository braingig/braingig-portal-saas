-- Run once in Supabase SQL Editor (Dashboard → SQL → New query)
-- Adds fields required by the Create Project modal

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

UPDATE public.projects SET status = 'planning' WHERE status = 'backlog';
UPDATE public.projects SET status = 'active' WHERE status = 'in_progress';
UPDATE public.projects SET status = 'on_hold' WHERE status = 'review';
UPDATE public.projects SET status = 'completed' WHERE status = 'done';

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-attachments', 'project-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated upload project attachments" ON storage.objects;
CREATE POLICY "Authenticated upload project attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-attachments');

DROP POLICY IF EXISTS "Authenticated delete project attachments" ON storage.objects;
CREATE POLICY "Authenticated delete project attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-attachments');

DROP POLICY IF EXISTS "Authenticated read project attachments" ON storage.objects;
CREATE POLICY "Authenticated read project attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-attachments');

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
