-- Run once in Supabase SQL Editor (Dashboard → SQL → New query)
-- Adds fields required by the Create Task modal

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
