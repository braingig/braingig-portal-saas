import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { getActiveOrgId, setActiveOrgId, clearActiveOrgId } from "@/lib/org-context";
import type { Database } from "@/integrations/supabase/types";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  status: Database["public"]["Enums"]["org_status"];
  logo_url: string | null;
  timezone: string;
};

export type OrgMembership = {
  organization_id: string;
  role: Database["public"]["Enums"]["app_role"];
  custom_permissions: string[] | null;
  organization: Organization;
};

type OrgContextValue = {
  org: Organization | null;
  memberships: OrgMembership[];
  orgId: string | null;
  loading: boolean;
  switchOrg: (orgId: string) => void;
  refresh: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [orgId, setOrgId] = useState<string | null>(getActiveOrgId());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setOrgId(null);
      clearActiveOrgId();
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id, role, custom_permissions, organizations(id, name, slug, status, logo_url, timezone)")
      .eq("user_id", user.id);

    const mapped: OrgMembership[] = (data ?? []).map((row) => ({
      organization_id: row.organization_id,
      role: row.role,
      custom_permissions: row.custom_permissions ?? null,
      organization: row.organizations as unknown as Organization,
    }));
    setMemberships(mapped);

    const stored = getActiveOrgId();
    const valid = mapped.find((m) => m.organization_id === stored);
    if (valid) {
      setOrgId(stored);
    } else if (mapped.length === 1) {
      setActiveOrgId(mapped[0].organization_id);
      setOrgId(mapped[0].organization_id);
    } else {
      setOrgId(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  useEffect(() => {
    const handler = () => setOrgId(getActiveOrgId());
    window.addEventListener("workpilot:org-changed", handler);
    return () => window.removeEventListener("workpilot:org-changed", handler);
  }, []);

  const switchOrg = useCallback((id: string) => {
    setActiveOrgId(id);
    setOrgId(id);
  }, []);

  const org = memberships.find((m) => m.organization_id === orgId)?.organization ?? null;

  return (
    <OrgContext.Provider value={{ org, memberships, orgId, loading, switchOrg, refresh: load }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrganization must be used within OrganizationProvider");
  return ctx;
}

export function requireOrgId(orgId: string | null): string {
  if (!orgId) throw new Error("No active organization");
  return orgId;
}
