-- Recruitment module: extended job and candidate fields

ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS closing_date date,
  ADD COLUMN IF NOT EXISTS open_positions integer NOT NULL DEFAULT 1;

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS interview_at timestamptz,
  ADD COLUMN IF NOT EXISTS interviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS offer_sent_at timestamptz;

NOTIFY pgrst, 'reload schema';
