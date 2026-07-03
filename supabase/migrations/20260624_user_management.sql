-- User management: member status + admin directory RPC (email, last login)

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS status public.member_status NOT NULL DEFAULT 'active';

DROP FUNCTION IF EXISTS public.get_organization_directory(uuid);

CREATE OR REPLACE FUNCTION public.get_organization_directory(_org_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  job_title text,
  role public.app_role,
  joined_at timestamptz,
  last_login_at timestamptz,
  member_status public.member_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.user_id,
    u.email,
    p.full_name,
    p.avatar_url,
    p.job_title,
    m.role,
    m.joined_at,
    u.last_sign_in_at,
    m.status
  FROM public.organization_members m
  INNER JOIN public.profiles p ON p.id = m.user_id
  INNER JOIN auth.users u ON u.id = m.user_id
  WHERE m.organization_id = _org_id
    AND public.has_any_org_role(auth.uid(), _org_id, ARRAY['owner', 'admin']::public.app_role[])
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_directory(uuid) TO authenticated;
