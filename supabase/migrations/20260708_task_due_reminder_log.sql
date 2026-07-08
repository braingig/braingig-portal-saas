-- Tracks task due-date reminders (7 / 3 / 1 days before) so cron does not resend.

CREATE TABLE IF NOT EXISTS public.task_due_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  days_before INT NOT NULL CHECK (days_before IN (1, 3, 7)),
  due_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, user_id, days_before, due_date)
);

CREATE INDEX IF NOT EXISTS task_due_reminder_log_task_idx
  ON public.task_due_reminder_log (task_id, due_date);

GRANT ALL ON public.task_due_reminder_log TO service_role;

ALTER TABLE public.task_due_reminder_log ENABLE ROW LEVEL SECURITY;
