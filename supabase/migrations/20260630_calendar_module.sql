-- Calendar module: extended events, participants, reminders, role-based RLS

-- Extend calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'never',
  ADD COLUMN IF NOT EXISTS recurrence_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'organization';

ALTER TABLE public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_recurrence_check;
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_recurrence_check
  CHECK (recurrence IN ('never', 'daily', 'weekly', 'monthly', 'yearly'));

ALTER TABLE public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_visibility_check;
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_visibility_check
  CHECK (visibility IN ('private', 'team', 'organization', 'clients'));

CREATE INDEX IF NOT EXISTS calendar_events_org_start_idx
  ON public.calendar_events (organization_id, start_at);
CREATE INDEX IF NOT EXISTS calendar_events_user_idx
  ON public.calendar_events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS calendar_events_project_idx
  ON public.calendar_events (project_id) WHERE project_id IS NOT NULL;

-- Participants (display + client sharing)
CREATE TABLE IF NOT EXISTS public.calendar_event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.calendar_event_participants ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.calendar_event_participants TO authenticated;
GRANT ALL ON public.calendar_event_participants TO service_role;

-- Reminder preferences per user per event
CREATE TABLE IF NOT EXISTS public.calendar_event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offset_minutes integer NOT NULL,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id, offset_minutes)
);
ALTER TABLE public.calendar_event_reminders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_event_reminders TO authenticated;
GRANT ALL ON public.calendar_event_reminders TO service_role;

CREATE INDEX IF NOT EXISTS calendar_event_reminders_pending_idx
  ON public.calendar_event_reminders (user_id, offset_minutes)
  WHERE notified_at IS NULL;

-- SECURITY DEFINER helpers avoid RLS recursion between calendar_events and participants
CREATE OR REPLACE FUNCTION public.is_calendar_event_participant(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.calendar_event_participants p
    WHERE p.event_id = _event_id AND p.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.calendar_event_organization_id(_event_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id FROM public.calendar_events WHERE id = _event_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_calendar_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.calendar_events e
    WHERE e.id = _event_id
      AND public.is_org_member(_user_id, e.organization_id)
      AND (
        e.created_by = _user_id
        OR public.has_any_org_role(_user_id, e.organization_id, ARRAY['owner','admin','hr']::public.app_role[])
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_calendar_event_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calendar_event_organization_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_calendar_event(uuid, uuid) TO authenticated;

-- Participant policies
CREATE POLICY "Org members read event participants" ON public.calendar_event_participants
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(
      auth.uid(),
      public.calendar_event_organization_id(calendar_event_participants.event_id)
    )
  );
CREATE POLICY "Event creators manage participants" ON public.calendar_event_participants
  FOR ALL TO authenticated
  USING (public.can_manage_calendar_event(calendar_event_participants.event_id, auth.uid()))
  WITH CHECK (public.can_manage_calendar_event(calendar_event_participants.event_id, auth.uid()));

-- Reminder policies
CREATE POLICY "Users read own reminders" ON public.calendar_event_reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own reminders" ON public.calendar_event_reminders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Event creators insert reminders for participants" ON public.calendar_event_reminders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(
      auth.uid(),
      public.calendar_event_organization_id(calendar_event_reminders.event_id)
    )
    AND (
      auth.uid() = calendar_event_reminders.user_id
      OR public.can_manage_calendar_event(calendar_event_reminders.event_id, auth.uid())
    )
  );

-- Replace calendar_events RLS with role-aware policies
DROP POLICY IF EXISTS "Org members read events" ON public.calendar_events;
DROP POLICY IF EXISTS "Org members manage events" ON public.calendar_events;

CREATE POLICY "Calendar read events" ON public.calendar_events
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (
      -- Owner / Admin / HR see all
      public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[])
      -- Holidays visible to everyone in org
      OR event_type = 'holiday'
      -- Organization-wide visibility
      OR visibility = 'organization'
      -- Own events
      OR created_by = auth.uid()
      OR user_id = auth.uid()
      -- Participant
      OR public.is_calendar_event_participant(calendar_events.id, auth.uid())
      -- Team lead sees team member events
      OR (
        public.has_any_org_role(auth.uid(), organization_id, ARRAY['team_lead']::public.app_role[])
        AND (
          visibility IN ('team', 'organization')
          OR user_id IN (
            SELECT emp.user_id FROM public.employees emp
            INNER JOIN public.employees mgr ON mgr.id = emp.manager_id
            WHERE mgr.user_id = auth.uid() AND emp.organization_id = calendar_events.organization_id
          )
        )
      )
      -- Clients: shared events only
      OR (
        public.has_any_org_role(auth.uid(), organization_id, ARRAY['client']::public.app_role[])
        AND (
          visibility = 'clients'
          OR event_type = 'holiday'
          OR public.is_calendar_event_participant(calendar_events.id, auth.uid())
        )
      )
      -- Employees see team visibility events
      OR visibility = 'team'
    )
  );

CREATE POLICY "Calendar insert events" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND auth.uid() = created_by
    AND (
      -- Holidays: admin/owner only
      event_type <> 'holiday'
      OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[])
    )
    AND (
      -- Leave events: HR can create for others
      event_type <> 'leave'
      OR user_id IS NULL
      OR user_id = auth.uid()
      OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[])
    )
  );

CREATE POLICY "Calendar update events" ON public.calendar_events
  FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (
      created_by = auth.uid()
      OR user_id = auth.uid()
      OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[])
      OR (
        event_type = 'leave'
        AND public.has_any_org_role(auth.uid(), organization_id, ARRAY['hr']::public.app_role[])
      )
    )
  )
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Calendar delete events" ON public.calendar_events
  FOR DELETE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (
      created_by = auth.uid()
      OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[])
      OR (
        event_type = 'leave'
        AND public.has_any_org_role(auth.uid(), organization_id, ARRAY['hr']::public.app_role[])
      )
    )
  );

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'calendar_event_participants') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_event_participants';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'calendar_event_reminders') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_event_reminders';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
