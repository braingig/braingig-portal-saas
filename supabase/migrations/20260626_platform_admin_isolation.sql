-- Platform administrators operate outside agency workspaces.
-- Block workspace creation and invite acceptance at the database layer.

CREATE OR REPLACE FUNCTION public.create_organization(_name text, _slug text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_org_id uuid;
  starter_plan_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Platform administrators cannot create agency workspaces';
  END IF;

  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  IF _slug IS NULL OR _slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid slug';
  END IF;

  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (trim(_name), lower(_slug), auth.uid())
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  SELECT id INTO starter_plan_id FROM public.subscription_plans WHERE slug = 'starter' LIMIT 1;
  INSERT INTO public.organization_subscriptions (organization_id, plan_id, status, seat_count)
  VALUES (new_org_id, starter_plan_id, 'trialing', 1);

  INSERT INTO public.channels (name, description, organization_id, created_by) VALUES
    ('general', 'Company-wide chatter', new_org_id, auth.uid()),
    ('design', 'Design team', new_org_id, auth.uid()),
    ('engineering', 'Engineering', new_org_id, auth.uid()),
    ('sales', 'Pipeline & wins', new_org_id, auth.uid())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (new_org_id, auth.uid(), 'organization.created', 'organization', new_org_id, jsonb_build_object('name', _name));

  RETURN new_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_organization_invite(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.organization_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Platform administrators cannot join agency workspaces';
  END IF;

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
