-- Attendance module: shifts, breaks, events, extended daily records

ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS work_date date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'present',
  ADD COLUMN IF NOT EXISTS break_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS working_minutes integer,
  ADD COLUMN IF NOT EXISTS overtime_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shift_id uuid,
  ADD COLUMN IF NOT EXISTS missed_checkout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.attendance_records
SET work_date = (clock_in AT TIME ZONE 'UTC')::date
WHERE work_date IS NULL;

ALTER TABLE public.attendance_records
  ALTER COLUMN work_date SET DEFAULT (CURRENT_DATE);

CREATE INDEX IF NOT EXISTS attendance_org_date_idx
  ON public.attendance_records (organization_id, work_date);
CREATE INDEX IF NOT EXISTS attendance_user_date_idx
  ON public.attendance_records (organization_id, user_id, work_date);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_one_per_user_day_idx
  ON public.attendance_records (organization_id, user_id, work_date)
  WHERE work_date IS NOT NULL;

DROP TRIGGER IF EXISTS attendance_records_updated_at ON public.attendance_records;
CREATE TRIGGER attendance_records_updated_at BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Work shifts
CREATE TABLE IF NOT EXISTS public.work_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '18:00',
  weekly_off_days integer[] NOT NULL DEFAULT ARRAY[0,6],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_shifts TO authenticated;
GRANT ALL ON public.work_shifts TO service_role;
CREATE TRIGGER work_shifts_updated_at BEFORE UPDATE ON public.work_shifts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Employee shift assignments
CREATE TABLE IF NOT EXISTS public.employee_shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.work_shifts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
ALTER TABLE public.employee_shift_assignments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_shift_assignments TO authenticated;
GRANT ALL ON public.employee_shift_assignments TO service_role;

ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_shift_id_fkey;
ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_shift_id_fkey
  FOREIGN KEY (shift_id) REFERENCES public.work_shifts(id) ON DELETE SET NULL;

-- Breaks
CREATE TABLE IF NOT EXISTS public.attendance_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_breaks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_breaks TO authenticated;
GRANT ALL ON public.attendance_breaks TO service_role;
CREATE INDEX IF NOT EXISTS attendance_breaks_record_idx ON public.attendance_breaks (record_id);

-- Timeline events
CREATE TABLE IF NOT EXISTS public.attendance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  record_id uuid REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.attendance_events TO authenticated;
GRANT ALL ON public.attendance_events TO service_role;
CREATE INDEX IF NOT EXISTS attendance_events_record_idx ON public.attendance_events (record_id, occurred_at);

-- RLS: work shifts
CREATE POLICY "Org members read shifts" ON public.work_shifts FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "HR manage shifts" ON public.work_shifts FOR ALL TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  WITH CHECK (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

-- RLS: shift assignments
CREATE POLICY "Org members read shift assignments" ON public.employee_shift_assignments FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "HR manage shift assignments" ON public.employee_shift_assignments FOR ALL TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  WITH CHECK (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

-- RLS: breaks (via record ownership)
CREATE POLICY "Read attendance breaks" ON public.attendance_breaks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_records r
      WHERE r.id = record_id
        AND public.is_org_member(auth.uid(), r.organization_id)
        AND (r.user_id = auth.uid() OR public.has_any_org_role(auth.uid(), r.organization_id, ARRAY['owner','admin','hr','team_lead']::public.app_role[]))
    )
  );
CREATE POLICY "Users manage own breaks" ON public.attendance_breaks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_records r
      WHERE r.id = record_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_records r
      WHERE r.id = record_id AND r.user_id = auth.uid()
    )
  );
CREATE POLICY "HR manage breaks" ON public.attendance_breaks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_records r
      WHERE r.id = record_id
        AND public.has_any_org_role(auth.uid(), r.organization_id, ARRAY['owner','admin','hr']::public.app_role[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_records r
      WHERE r.id = record_id
        AND public.has_any_org_role(auth.uid(), r.organization_id, ARRAY['owner','admin','hr']::public.app_role[])
    )
  );

-- RLS: events
CREATE POLICY "Read attendance events" ON public.attendance_events FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (user_id = auth.uid() OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr','team_lead']::public.app_role[]))
  );
CREATE POLICY "Users insert own events" ON public.attendance_events FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = user_id);
CREATE POLICY "HR manage events" ON public.attendance_events FOR DELETE TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

-- HR can insert/update/delete attendance records
DROP POLICY IF EXISTS "Users clock in" ON public.attendance_records;
DROP POLICY IF EXISTS "Users update own attendance" ON public.attendance_records;

CREATE POLICY "Users clock in" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND (auth.uid() = user_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  );

CREATE POLICY "Attendance update" ON public.attendance_records FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (auth.uid() = user_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  )
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "HR delete attendance" ON public.attendance_records FOR DELETE TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

NOTIFY pgrst, 'reload schema';
