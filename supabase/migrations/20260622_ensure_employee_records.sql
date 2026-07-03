-- Ensure every workspace member has a corresponding HR employee record

CREATE OR REPLACE FUNCTION public.ensure_organization_employee_records(_org_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inserted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_org_member(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  INSERT INTO public.employees (
    organization_id,
    user_id,
    full_name,
    email,
    hire_date,
    status
  )
  SELECT
    m.organization_id,
    m.user_id,
    COALESCE(NULLIF(trim(p.full_name), ''), split_part(u.email, '@', 1)),
    u.email,
    m.joined_at::date,
    'active'
  FROM public.organization_members m
  INNER JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.organization_id = _org_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.organization_id = _org_id
        AND (
          e.user_id = m.user_id
          OR lower(trim(e.email)) = lower(trim(u.email))
        )
    );

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_organization_employee_records(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
