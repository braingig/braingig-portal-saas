

-- MIGRATION: 20260618061744_ff9bfc47-fc0a-44c3-9a09-c02079055fc3.sql


-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Retroactively populate profiles for any existing users in auth.users
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), 
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'member'
FROM auth.users
ON CONFLICT DO NOTHING;

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  progress INT NOT NULL DEFAULT 0,
  budget NUMERIC(12,2) DEFAULT 0,
  due_date DATE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects visible to authenticated" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners or admins delete projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks visible to authenticated" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Creators or admins delete tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Deals (CRM)
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  value NUMERIC(12,2) DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'lead',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expected_close DATE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deals visible to authenticated" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Authenticated update deals" ON public.deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Owners or admins delete deals" ON public.deals FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Time entries
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Time entries visible to authenticated" ON public.time_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own time entries" ON public.time_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own time entries" ON public.time_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own time entries" ON public.time_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Channels
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO authenticated;
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channels visible to authenticated" ON public.channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages visible to authenticated" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors edit own messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authors delete own messages" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Realtime for messages


-- Seed default channels
INSERT INTO public.channels (name, description) VALUES
  ('general', 'Company-wide chatter'),
  ('design', 'Design team channel'),
  ('engineering', 'Engineering discussions'),
  ('sales', 'Pipeline & wins'),
  ('random', 'Off-topic')
ON CONFLICT (name) DO NOTHING;


-- MIGRATION: 20260618061831_df3c47a0-41a9-4065-a248-33c71b85dacc.sql


-- Recreate functions with explicit search_path (already set, but linter wants consistency)
-- and revoke public EXECUTE on definer functions.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- touch_updated_at needs explicit search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Tighten permissive UPDATE policies
DROP POLICY IF EXISTS "Authenticated update tasks" ON public.tasks;
CREATE POLICY "Update own or assigned tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = assignee_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = created_by OR auth.uid() = assignee_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated update deals" ON public.deals;
CREATE POLICY "Owners or admins update deals" ON public.deals
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));


-- MIGRATION: 20260618063354_a5d43f06-3fd8-4d55-a6db-3684a0e1e1ea.sql


ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';


-- MIGRATION: 20260618063438_2c6ec412-90aa-4ecd-8d87-e64fca963f95.sql


-- has_any_role helper
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

-- Replace handle_new_user: first user = owner, rest = employee
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;

  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Owner role policies on user_roles
DROP POLICY IF EXISTS "Owners read all roles" ON public.user_roles;
CREATE POLICY "Owners read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Owners manage roles" ON public.user_roles;
CREATE POLICY "Owners manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Tasks: nesting & completion
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS completion_percent integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS tasks_parent_id_idx ON public.tasks(parent_id);

-- Task watchers
CREATE TABLE IF NOT EXISTS public.task_watchers (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.task_watchers TO authenticated;
GRANT ALL ON public.task_watchers TO service_role;
ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Watchers visible to authenticated" ON public.task_watchers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Watch yourself" ON public.task_watchers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unwatch yourself" ON public.task_watchers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  completion_percent integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT ALL ON public.milestones TO service_role;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Milestones visible to authenticated" ON public.milestones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create milestones" ON public.milestones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Privileged update milestones" ON public.milestones
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = owner_id OR public.has_any_role(auth.uid(), ARRAY['owner','admin','team_lead']::app_role[]))
  WITH CHECK (auth.uid() = created_by OR auth.uid() = owner_id OR public.has_any_role(auth.uid(), ARRAY['owner','admin','team_lead']::app_role[]));
CREATE POLICY "Privileged delete milestones" ON public.milestones
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_any_role(auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER milestones_updated_at BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Task comments (threaded)
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  mentions uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments visible to authenticated" ON public.task_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors create comments" ON public.task_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own comments" ON public.task_comments
  FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins delete comments" ON public.task_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.has_any_role(auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE TRIGGER task_comments_updated_at BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON public.task_comments(task_id);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Privileged read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['owner','admin']::app_role[]));
CREATE POLICY "Authenticated write audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at DESC);

-- Realtime





-- MIGRATION: 20260618064122_c18c67fe-e942-44f1-9e10-962d2b80d77d.sql


GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, anon;


-- MIGRATION: 20260618120000_saas_multi_tenant.sql

-- WorkPilot SaaS: multi-tenancy, platform admin, full module schema, org-scoped RLS

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.org_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'incomplete');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_status AS ENUM ('draft', 'processing', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Platform ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly_cents integer NOT NULL DEFAULT 0,
  price_yearly_cents integer NOT NULL DEFAULT 0,
  max_seats integer NOT NULL DEFAULT 10,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  stripe_price_monthly_id text,
  stripe_price_yearly_id text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status public.org_status NOT NULL DEFAULT 'trial',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  logo_url text,
  website text,
  timezone text NOT NULL DEFAULT 'UTC',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'employee',
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS org_members_user_idx ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS org_members_org_idx ON public.organization_members(organization_id);

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'employee',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS org_invites_token_idx ON public.organization_invites(token);

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  seat_count integer NOT NULL DEFAULT 1,
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER org_subscriptions_updated_at BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─── Security helpers ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_org_role(_user_id uuid, _org_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_any_org_role(uuid, uuid, public.app_role[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids(uuid) TO authenticated, anon;

-- ─── Add organization_id to existing tables ──────────────────────────────────
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_name_key;
ALTER TABLE public.channels ADD CONSTRAINT channels_org_name_key UNIQUE (organization_id, name);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Migrate legacy data into a default org if needed
DO $$
DECLARE
  default_org_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.projects WHERE organization_id IS NULL LIMIT 1)
     OR EXISTS (SELECT 1 FROM public.tasks WHERE organization_id IS NULL LIMIT 1) THEN
    INSERT INTO public.organizations (name, slug, status)
    VALUES ('Legacy Workspace', 'legacy-workspace', 'active')
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'legacy-workspace';

    UPDATE public.projects SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.tasks SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.deals SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.channels SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.messages SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.time_entries SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.milestones SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.notifications SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.audit_logs SET organization_id = default_org_id WHERE organization_id IS NULL;
  END IF;
END $$;

-- Migrate user_roles → organization_members for legacy org
DO $$
DECLARE
  default_org_id uuid;
  r RECORD;
BEGIN
  SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'legacy-workspace';
  IF default_org_id IS NOT NULL THEN
    FOR r IN SELECT user_id, role FROM public.user_roles LOOP
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (default_org_id, r.user_id, r.role)
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- ─── HR & Operations tables ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  department text,
  job_title text,
  hire_date date,
  salary_cents integer,
  status text NOT NULL DEFAULT 'active',
  manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS employees_org_idx ON public.employees(organization_id);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS attendance_org_user_idx ON public.attendance_records(organization_id, user_id);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'annual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  department text,
  description text,
  status text NOT NULL DEFAULT 'open',
  hiring_manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER job_postings_updated_at BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  stage text NOT NULL DEFAULT 'applied',
  notes text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER candidates_updated_at BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status public.payroll_status NOT NULL DEFAULT 'draft',
  total_cents integer NOT NULL DEFAULT 0,
  processed_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  gross_cents integer NOT NULL DEFAULT 0,
  deductions_cents integer NOT NULL DEFAULT 0,
  net_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

-- ─── Collaboration tables ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.document_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.file_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  mime_type text,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.file_assets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  event_type text NOT NULL DEFAULT 'meeting',
  color text,
  location text,
  notes text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  recurrence text NOT NULL DEFAULT 'never',
  recurrence_end_at timestamptz,
  recurrence_parent_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'organization',
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.calendar_event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.calendar_event_participants ENABLE ROW LEVEL SECURITY;

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

-- ─── Update handle_new_user: first user = platform admin ──────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  SELECT NOT EXISTS (SELECT 1 FROM auth.users WHERE id <> NEW.id) INTO is_first;
  IF is_first THEN
    INSERT INTO public.platform_admins (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- ─── Org creation RPC (secure) ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_organization(_name text, _slug text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_org_id uuid;
  starter_plan_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
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

  -- Default channels for the agency
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

GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite(text) TO authenticated;
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

-- ─── Seed subscription plans ─────────────────────────────────────────────────
INSERT INTO public.subscription_plans (name, slug, description, price_monthly_cents, price_yearly_cents, max_seats, features, sort_order)
VALUES
  ('Starter', 'starter', 'For small agencies getting started', 4900, 47000, 10, '["Projects","Tasks","CRM","Messages"]'::jsonb, 1),
  ('Growth', 'growth', 'For growing agencies', 9900, 95000, 50, '["Everything in Starter","HR","Payroll","Reports"]'::jsonb, 2),
  ('Enterprise', 'enterprise', 'For large agencies', 24900, 239000, 500, '["Everything in Growth","SSO","Audit","Priority support"]'::jsonb, 3)
ON CONFLICT (slug) DO NOTHING;

-- ─── Grants ──────────────────────────────────────────────────────────────────
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
GRANT SELECT ON public.subscription_plans TO authenticated, anon;
GRANT ALL ON public.subscription_plans TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invites TO authenticated;
GRANT ALL ON public.organization_invites TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.organization_subscriptions TO authenticated;
GRANT ALL ON public.organization_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;
GRANT ALL ON public.job_postings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_runs TO authenticated;
GRANT ALL ON public.payroll_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_items TO authenticated;
GRANT ALL ON public.payroll_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_folders TO authenticated;
GRANT ALL ON public.document_folders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_assets TO authenticated;
GRANT ALL ON public.file_assets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;

-- ─── RLS Policies ────────────────────────────────────────────────────────────

-- Platform admins
DROP POLICY IF EXISTS "Platform admins read self" ON public.platform_admins;
CREATE POLICY "Platform admins read self" ON public.platform_admins
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- Subscription plans (public read)
DROP POLICY IF EXISTS "Anyone reads active plans" ON public.subscription_plans;
CREATE POLICY "Anyone reads active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins manage plans" ON public.subscription_plans;
CREATE POLICY "Platform admins manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Organizations
DROP POLICY IF EXISTS "Members read own orgs" ON public.organizations;
CREATE POLICY "Members read own orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), id) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners update org" ON public.organizations;
CREATE POLICY "Owners update org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.has_any_org_role(auth.uid(), id, ARRAY['owner','admin']::public.app_role[]) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.has_any_org_role(auth.uid(), id, ARRAY['owner','admin']::public.app_role[]) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated create org via RPC only" ON public.organizations;
CREATE POLICY "Platform admins manage orgs" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Organization members
DROP POLICY IF EXISTS "Members read org roster" ON public.organization_members;
CREATE POLICY "Members read org roster" ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners manage members" ON public.organization_members;
CREATE POLICY "Owners manage members" ON public.organization_members
  FOR ALL TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[]) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[]) OR public.is_platform_admin(auth.uid()));

-- Invites
DROP POLICY IF EXISTS "Owners manage invites" ON public.organization_invites;
CREATE POLICY "Owners manage invites" ON public.organization_invites
  FOR ALL TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  WITH CHECK (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

-- Subscriptions
DROP POLICY IF EXISTS "Org owners read subscription" ON public.organization_subscriptions;
CREATE POLICY "Org owners read subscription" ON public.organization_subscriptions
  FOR SELECT TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[]) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins manage subscriptions" ON public.organization_subscriptions;
CREATE POLICY "Platform admins manage subscriptions" ON public.organization_subscriptions
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Macro: replace permissive policies on tenant tables
-- Projects
DROP POLICY IF EXISTS "Projects visible to authenticated" ON public.projects;
DROP POLICY IF EXISTS "Authenticated create projects" ON public.projects;
DROP POLICY IF EXISTS "Owners update projects" ON public.projects;
DROP POLICY IF EXISTS "Owners or admins delete projects" ON public.projects;
CREATE POLICY "Org members read projects" ON public.projects FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Org members create projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = owner_id);
CREATE POLICY "Privileged update projects" ON public.projects FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND (auth.uid() = owner_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','team_lead']::public.app_role[])))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Privileged delete projects" ON public.projects FOR DELETE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND (auth.uid() = owner_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[])));

-- Tasks
DROP POLICY IF EXISTS "Tasks visible to authenticated" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Update own or assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Creators or admins delete tasks" ON public.tasks;
CREATE POLICY "Org members read tasks" ON public.tasks FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Org members create tasks" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = created_by);
CREATE POLICY "Org members update tasks" ON public.tasks FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND (auth.uid() = created_by OR auth.uid() = assignee_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','team_lead']::public.app_role[])))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Privileged delete tasks" ON public.tasks FOR DELETE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND (auth.uid() = created_by OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[])));

-- Deals
DROP POLICY IF EXISTS "Deals visible to authenticated" ON public.deals;
DROP POLICY IF EXISTS "Authenticated create deals" ON public.deals;
DROP POLICY IF EXISTS "Owners or admins update deals" ON public.deals;
DROP POLICY IF EXISTS "Owners or admins delete deals" ON public.deals;
CREATE POLICY "Org members read deals" ON public.deals FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create deals" ON public.deals FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = owner_id);
CREATE POLICY "Org members update deals" ON public.deals FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Privileged delete deals" ON public.deals FOR DELETE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND (auth.uid() = owner_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[])));

-- Channels & messages
DROP POLICY IF EXISTS "Channels visible to authenticated" ON public.channels;
DROP POLICY IF EXISTS "Authenticated create channels" ON public.channels;
CREATE POLICY "Org members read channels" ON public.channels FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create channels" ON public.channels FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Messages visible to authenticated" ON public.messages;
DROP POLICY IF EXISTS "Authenticated send messages" ON public.messages;
DROP POLICY IF EXISTS "Authors edit own messages" ON public.messages;
DROP POLICY IF EXISTS "Authors delete own messages" ON public.messages;
CREATE POLICY "Org members read messages" ON public.messages FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = user_id);
CREATE POLICY "Authors edit messages" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors delete messages" ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[]));

-- Time entries
DROP POLICY IF EXISTS "Time entries visible to authenticated" ON public.time_entries;
DROP POLICY IF EXISTS "Users insert own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users update own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users delete own time entries" ON public.time_entries;
CREATE POLICY "Org members read time entries" ON public.time_entries FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Users insert own time entries" ON public.time_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = user_id);
CREATE POLICY "Users update own time entries" ON public.time_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own time entries" ON public.time_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Milestones
DROP POLICY IF EXISTS "Milestones visible to authenticated" ON public.milestones;
DROP POLICY IF EXISTS "Authenticated create milestones" ON public.milestones;
DROP POLICY IF EXISTS "Privileged update milestones" ON public.milestones;
DROP POLICY IF EXISTS "Privileged delete milestones" ON public.milestones;
CREATE POLICY "Org members read milestones" ON public.milestones FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create milestones" ON public.milestones FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = created_by);
CREATE POLICY "Privileged update milestones" ON public.milestones FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Privileged delete milestones" ON public.milestones FOR DELETE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','team_lead']::public.app_role[]));

-- Notifications
DROP POLICY IF EXISTS "Read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Delete own notifications" ON public.notifications;
CREATE POLICY "Read own org notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id)));
CREATE POLICY "Create org notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Audit logs
DROP POLICY IF EXISTS "Privileged read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated write audit logs" ON public.audit_logs;
CREATE POLICY "Privileged read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (organization_id IS NULL AND public.is_platform_admin(auth.uid())
    OR organization_id IS NOT NULL AND public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY "Org members write audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id AND (organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id)));

-- Task comments & watchers (via task org membership)
DROP POLICY IF EXISTS "Comments visible to authenticated" ON public.task_comments;
DROP POLICY IF EXISTS "Authors create comments" ON public.task_comments;
DROP POLICY IF EXISTS "Authors update own comments" ON public.task_comments;
DROP POLICY IF EXISTS "Authors or admins delete comments" ON public.task_comments;
CREATE POLICY "Org members read comments" ON public.task_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_org_member(auth.uid(), t.organization_id)));
CREATE POLICY "Org members create comments" ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_org_member(auth.uid(), t.organization_id)));
CREATE POLICY "Authors update comments" ON public.task_comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Privileged delete comments" ON public.task_comments FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.has_any_org_role(auth.uid(), t.organization_id, ARRAY['owner','admin']::public.app_role[])));

DROP POLICY IF EXISTS "Watchers visible to authenticated" ON public.task_watchers;
DROP POLICY IF EXISTS "Watch yourself" ON public.task_watchers;
DROP POLICY IF EXISTS "Unwatch yourself" ON public.task_watchers;
CREATE POLICY "Org members read watchers" ON public.task_watchers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_org_member(auth.uid(), t.organization_id)));
CREATE POLICY "Watch yourself" ON public.task_watchers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_org_member(auth.uid(), t.organization_id)));
CREATE POLICY "Unwatch yourself" ON public.task_watchers FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- New module RLS (org-scoped)
CREATE POLICY "Org members read employees" ON public.employees FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "HR manage employees" ON public.employees FOR ALL TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  WITH CHECK (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

CREATE POLICY "Org members read attendance" ON public.attendance_records FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND (auth.uid() = user_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr','team_lead']::public.app_role[])));
CREATE POLICY "Users clock in" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = user_id);
CREATE POLICY "Users update own attendance" ON public.attendance_records FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members read leave" ON public.leave_requests FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND (auth.uid() = user_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr','team_lead']::public.app_role[])));
CREATE POLICY "Users request leave" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id) AND auth.uid() = user_id);
CREATE POLICY "HR review leave" ON public.leave_requests FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id) AND (auth.uid() = user_id OR public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[])))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members read jobs" ON public.job_postings FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "HR manage jobs" ON public.job_postings FOR ALL TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  WITH CHECK (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

CREATE POLICY "Org members read candidates" ON public.candidates FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "HR manage candidates" ON public.candidates FOR ALL TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  WITH CHECK (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

CREATE POLICY "Privileged read payroll" ON public.payroll_runs FOR SELECT TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));
CREATE POLICY "Privileged manage payroll" ON public.payroll_runs FOR ALL TO authenticated
  USING (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]))
  WITH CHECK (public.has_any_org_role(auth.uid(), organization_id, ARRAY['owner','admin','hr']::public.app_role[]));

CREATE POLICY "Privileged read payroll items" ON public.payroll_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.payroll_runs pr WHERE pr.id = payroll_run_id AND public.has_any_org_role(auth.uid(), pr.organization_id, ARRAY['owner','admin','hr']::public.app_role[])));
CREATE POLICY "Privileged manage payroll items" ON public.payroll_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.payroll_runs pr WHERE pr.id = payroll_run_id AND public.has_any_org_role(auth.uid(), pr.organization_id, ARRAY['owner','admin','hr']::public.app_role[])))
  WITH CHECK (EXISTS (SELECT 1 FROM public.payroll_runs pr WHERE pr.id = payroll_run_id AND public.has_any_org_role(auth.uid(), pr.organization_id, ARRAY['owner','admin','hr']::public.app_role[])));

CREATE POLICY "Org members read folders" ON public.document_folders FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members manage folders" ON public.document_folders FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members read documents" ON public.documents FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members manage documents" ON public.documents FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members read files" ON public.file_assets FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members manage files" ON public.file_assets FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members read events" ON public.calendar_events FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members manage events" ON public.calendar_events FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- Realtime






-- MIGRATION: 20260618152500_task_features_and_activity.sql

-- Task Assignees (Multiple users per task)
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Task assignees visible to authenticated" ON public.task_assignees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create task assignees" ON public.task_assignees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated delete task assignees" ON public.task_assignees FOR DELETE TO authenticated USING (true);

-- Task Chats (Separate from comments)
CREATE TABLE IF NOT EXISTS public.task_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Task chats visible to authenticated" ON public.task_chats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create task chats" ON public.task_chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Device Activity
CREATE TABLE IF NOT EXISTS public.device_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'idle')),
  duration_seconds INT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.device_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activity visible to authenticated" ON public.device_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own activity" ON public.device_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- MIGRATION: 20260618155700_fix_profiles_relations.sql

-- Fix relationships to profiles so Postgrest can resolve profiles(...) joins in client-side queries

ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey,
  ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.task_comments 
  DROP CONSTRAINT IF EXISTS task_comments_author_id_fkey,
  ADD CONSTRAINT task_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.task_chats 
  DROP CONSTRAINT IF EXISTS task_chats_user_id_fkey,
  ADD CONSTRAINT task_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_user_id_fkey,
  ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey,
  ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- SAFE REALTIME BINDINGS
DO $$
DECLARE
  t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'task_comments') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'organization_members') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'leave_requests') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'calendar_events') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events';
  END IF;
END $$;


-- MIGRATION: extend projects for create-project modal
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

UPDATE public.projects SET status = 'planning' WHERE status = 'backlog';
UPDATE public.projects SET status = 'active' WHERE status = 'in_progress';
UPDATE public.projects SET status = 'on_hold' WHERE status = 'review';
UPDATE public.projects SET status = 'completed' WHERE status = 'done';

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-attachments', 'project-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated upload project attachments" ON storage.objects;
CREATE POLICY "Authenticated upload project attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-attachments');

DROP POLICY IF EXISTS "Authenticated read project attachments" ON storage.objects;
CREATE POLICY "Authenticated read project attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-attachments');


-- MIGRATION: 20260624_user_management.sql
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


-- MIGRATION: 20260625_member_permissions.sql
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS custom_permissions text[] DEFAULT NULL;

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
  member_status public.member_status,
  custom_permissions text[]
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
    m.status,
    m.custom_permissions
  FROM public.organization_members m
  INNER JOIN public.profiles p ON p.id = m.user_id
  INNER JOIN auth.users u ON u.id = m.user_id
  WHERE m.organization_id = _org_id
    AND public.has_any_org_role(auth.uid(), _org_id, ARRAY['owner', 'admin']::public.app_role[])
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_directory(uuid) TO authenticated;
