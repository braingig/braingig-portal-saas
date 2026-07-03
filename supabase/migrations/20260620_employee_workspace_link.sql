-- Links HR employee records to workspace accounts on invite accept + manual sync

CREATE OR REPLACE FUNCTION public.accept_organization_invite(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.organization_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO inv FROM public.organization_invites
  WHERE token = _token AND accepted_at IS NULL AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired invite'; END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (inv.organization_id, auth.uid(), inv.role, inv.invited_by)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.organization_invites SET accepted_at = now() WHERE id = inv.id;

  UPDATE public.employees e
  SET user_id = auth.uid(), updated_at = now()
  WHERE e.organization_id = inv.organization_id
    AND lower(trim(e.email)) = lower(trim(inv.email))
    AND (e.user_id IS NULL OR e.user_id = auth.uid());

  RETURN inv.organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_organization_employees(_org_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  linked_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_org_member(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;
  IF NOT public.has_any_org_role(auth.uid(), _org_id, ARRAY['owner','admin','hr']::public.app_role[]) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE public.employees e
  SET user_id = u.id, updated_at = now()
  FROM auth.users u
  INNER JOIN public.organization_members m
    ON m.user_id = u.id AND m.organization_id = _org_id
  WHERE e.organization_id = _org_id
    AND e.user_id IS NULL
    AND lower(trim(e.email)) = lower(trim(u.email));

  GET DIAGNOSTICS linked_count = ROW_COUNT;
  RETURN linked_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_organization_employees(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_my_employee_record()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL OR length(trim(user_email)) = 0 THEN RETURN; END IF;

  UPDATE public.employees e
  SET user_id = auth.uid(), updated_at = now()
  FROM public.organization_members m
  WHERE m.user_id = auth.uid()
    AND m.organization_id = e.organization_id
    AND e.user_id IS NULL
    AND lower(trim(e.email)) = lower(trim(user_email));
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_my_employee_record() TO authenticated;

NOTIFY pgrst, 'reload schema';
