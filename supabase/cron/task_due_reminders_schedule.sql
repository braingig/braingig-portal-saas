-- Run once in Supabase Dashboard → SQL Editor AFTER:
--   1. This migration is applied (task_due_reminder_log table exists)
--   2. App is deployed with CRON_SECRET set in hosting env
--   3. Replace placeholders below, then execute

-- Remove an existing job if you are re-scheduling:
-- SELECT cron.unschedule('task-due-reminders-daily');

SELECT cron.schedule(
  'task-due-reminders-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://braingig-portal-saas.vercel.app/api/cron/task-due-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verify scheduled jobs:
-- SELECT * FROM cron.job;

-- Manual test (replace URL and secret):
-- SELECT net.http_post(
--   url := 'https://braingig-portal-saas.vercel.app/api/cron/task-due-reminders',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer YOUR_CRON_SECRET'
--   ),
--   body := '{}'::jsonb
-- );
