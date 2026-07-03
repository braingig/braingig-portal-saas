-- Deduplicate employee records: link manual HR rows to workspace accounts and remove duplicates

CREATE OR REPLACE FUNCTION public.ensure_organization_employee_records(_org_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inserted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_org_member(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  -- Link existing manual HR rows to workspace accounts by email
  UPDATE public.employees e
  SET user_id = m.user_id, updated_at = now()
  FROM public.organization_members m
  INNER JOIN auth.users u ON u.id = m.user_id
  WHERE e.organization_id = _org_id
    AND m.organization_id = _org_id
    AND e.user_id IS NULL
    AND lower(trim(e.email)) = lower(trim(u.email));

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

CREATE OR REPLACE FUNCTION public.dedupe_organization_employees(_org_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  removed_count integer := 0;
  removed_extra integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_org_member(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  -- Link orphaned manual rows before deduping
  UPDATE public.employees e
  SET user_id = m.user_id, updated_at = now()
  FROM public.organization_members m
  INNER JOIN auth.users u ON u.id = m.user_id
  WHERE e.organization_id = _org_id
    AND m.organization_id = _org_id
    AND e.user_id IS NULL
    AND lower(trim(e.email)) = lower(trim(u.email));

  -- Drop duplicate rows for the same workspace member (keep the richest HR record)
  WITH member_employees AS (
    SELECT
      m.user_id AS member_user_id,
      e.id AS employee_id,
      e.created_at,
      (
        (CASE WHEN e.department IS NOT NULL AND e.department <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN e.salary_cents IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN e.hire_date IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN e.phone IS NOT NULL AND e.phone <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN e.skills IS NOT NULL AND e.skills <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN e.job_title IS NOT NULL AND e.job_title <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN e.user_id IS NOT NULL THEN 2 ELSE 0 END)
      ) AS richness
    FROM public.organization_members m
    INNER JOIN auth.users u ON u.id = m.user_id
    INNER JOIN public.employees e ON e.organization_id = _org_id
      AND (
        e.user_id = m.user_id
        OR lower(trim(e.email)) = lower(trim(u.email))
      )
    WHERE m.organization_id = _org_id
  ),
  ranked AS (
    SELECT
      employee_id,
      ROW_NUMBER() OVER (
        PARTITION BY member_user_id
        ORDER BY richness DESC, created_at ASC
      ) AS rn
    FROM member_employees
  )
  DELETE FROM public.employees e
  USING ranked r
  WHERE e.id = r.employee_id AND r.rn > 1;

  GET DIAGNOSTICS removed_extra = ROW_COUNT;
  removed_count := removed_count + COALESCE(removed_extra, 0);

  -- Drop duplicate rows with the same email within the org
  WITH email_dupes AS (
    SELECT
      e.id AS employee_id,
      ROW_NUMBER() OVER (
        PARTITION BY lower(trim(e.email))
        ORDER BY
          (CASE WHEN e.user_id IS NOT NULL THEN 1 ELSE 0 END) DESC,
          e.created_at ASC
      ) AS rn
    FROM public.employees e
    WHERE e.organization_id = _org_id
      AND length(trim(e.email)) > 0
  )
  DELETE FROM public.employees e
  USING email_dupes d
  WHERE e.id = d.employee_id AND d.rn > 1;

  GET DIAGNOSTICS removed_extra = ROW_COUNT;
  removed_count := removed_count + COALESCE(removed_extra, 0);

  RETURN removed_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dedupe_organization_employees(uuid) TO authenticated;

-- One-time cleanup for existing duplicate rows (runs without auth context)
WITH member_employees AS (
  SELECT
    m.user_id AS member_user_id,
    e.id AS employee_id,
    e.created_at,
    (
      (CASE WHEN e.department IS NOT NULL AND e.department <> '' THEN 1 ELSE 0 END)
      + (CASE WHEN e.salary_cents IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN e.hire_date IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN e.phone IS NOT NULL AND e.phone <> '' THEN 1 ELSE 0 END)
      + (CASE WHEN e.skills IS NOT NULL AND e.skills <> '' THEN 1 ELSE 0 END)
      + (CASE WHEN e.job_title IS NOT NULL AND e.job_title <> '' THEN 1 ELSE 0 END)
      + (CASE WHEN e.user_id IS NOT NULL THEN 2 ELSE 0 END)
    ) AS richness
  FROM public.organization_members m
  INNER JOIN auth.users u ON u.id = m.user_id
  INNER JOIN public.employees e ON e.organization_id = m.organization_id
    AND (
      e.user_id = m.user_id
      OR lower(trim(e.email)) = lower(trim(u.email))
    )
),
ranked AS (
  SELECT
    employee_id,
    ROW_NUMBER() OVER (
      PARTITION BY member_user_id
      ORDER BY richness DESC, created_at ASC
    ) AS rn
  FROM member_employees
)
DELETE FROM public.employees e
USING ranked r
WHERE e.id = r.employee_id AND r.rn > 1;

WITH email_dupes AS (
  SELECT
    e.id AS employee_id,
    ROW_NUMBER() OVER (
      PARTITION BY e.organization_id, lower(trim(e.email))
      ORDER BY
        (CASE WHEN e.user_id IS NOT NULL THEN 1 ELSE 0 END) DESC,
        e.created_at ASC
    ) AS rn
  FROM public.employees e
  WHERE length(trim(e.email)) > 0
)
DELETE FROM public.employees e
USING email_dupes d
WHERE e.id = d.employee_id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS employees_org_email_unique
  ON public.employees (organization_id, lower(trim(email)));

CREATE UNIQUE INDEX IF NOT EXISTS employees_org_user_unique
  ON public.employees (organization_id, user_id)
  WHERE user_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
