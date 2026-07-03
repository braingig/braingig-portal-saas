-- Fix infinite RLS recursion between calendar_events and calendar_event_participants.
-- Policies on each table were querying the other, causing circular checks.

CREATE OR REPLACE FUNCTION public.is_calendar_event_participant(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.calendar_event_participants p
    WHERE p.event_id = _event_id AND p.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.calendar_event_organization_id(_event_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.calendar_events WHERE id = _event_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_calendar_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Participants: stop querying calendar_events inside RLS (that re-triggered event policies)
DROP POLICY IF EXISTS "Org members read event participants" ON public.calendar_event_participants;
DROP POLICY IF EXISTS "Event creators manage participants" ON public.calendar_event_participants;

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

-- Reminders: same pattern
DROP POLICY IF EXISTS "Event creators insert reminders for participants" ON public.calendar_event_reminders;

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

-- Calendar events read: use SECURITY DEFINER participant check
DROP POLICY IF EXISTS "Calendar read events" ON public.calendar_events;

CREATE POLICY "Calendar read events" ON public.calendar_events
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND (
      public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[])
      OR event_type = 'holiday'
      OR visibility = 'organization'
      OR created_by = auth.uid()
      OR user_id = auth.uid()
      OR public.is_calendar_event_participant(calendar_events.id, auth.uid())
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
      OR (
        public.has_any_org_role(auth.uid(), organization_id, ARRAY['client']::public.app_role[])
        AND (
          visibility = 'clients'
          OR event_type = 'holiday'
          OR public.is_calendar_event_participant(calendar_events.id, auth.uid())
        )
      )
      OR visibility = 'team'
    )
  );

NOTIFY pgrst, 'reload schema';
