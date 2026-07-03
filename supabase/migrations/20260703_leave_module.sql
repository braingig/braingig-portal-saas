-- Leave module: extended fields and team lead approval

ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS half_day boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS review_comment text;

-- Team lead can approve leave for direct reports
DROP POLICY IF EXISTS "HR review leave" ON public.leave_requests;

CREATE POLICY "Leave update" ON public.leave_requests FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id) AND (
      auth.uid() = user_id
      OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[])
      OR (
        public.has_org_role(auth.uid(), organization_id, 'team_lead')
        AND EXISTS (
          SELECT 1 FROM public.employees e
          JOIN public.employees lead
            ON lead.organization_id = e.organization_id
            AND lead.user_id = auth.uid()
          WHERE e.user_id = leave_requests.user_id
            AND e.organization_id = leave_requests.organization_id
            AND e.manager_id = lead.id
        )
      )
    )
  )
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

NOTIFY pgrst, 'reload schema';
