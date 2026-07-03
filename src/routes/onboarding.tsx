import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { checkIsPlatformAdmin } from "@/lib/auth-routing";
import { linkMyEmployeeRecord } from "@/lib/employees/invites";
import {
  sendMemberJoinedEmail,
  sendOrganizationCreatedEmail,
} from "@/lib/email/notifications";
import { inviteTokenFromSearch, parseInviteSearch } from "@/lib/invite-flow";
import { setActiveOrgId } from "@/lib/org-context";
import { toast } from "sonner";
import { Building2, KeyRound, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  validateSearch: parseInviteSearch,
  ssr: false,
  beforeLoad: async ({ search }) => {
    const inviteToken = inviteTokenFromSearch(search);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }

    if (await checkIsPlatformAdmin(data.user.id)) {
      throw redirect({ to: "/platform" });
    }

    if (!inviteToken) {
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", data.user.id)
        .limit(1);

      if (memberships?.length) throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Set up workspace · WorkPilot" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const { refresh } = useOrganization();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [inviteToken, setInviteToken] = useState(() => inviteTokenFromSearch(search));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = inviteTokenFromSearch(search);
    if (token) setInviteToken(token);
  }, [search]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (inviteToken.trim()) setMode("join");
  }, [inviteToken]);

  function slugify(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  }

  async function createAgency(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const s = slug.trim() || slugify(name);
    setSubmitting(true);
    const { data: orgId, error } = await supabase.rpc("create_organization", { _name: name.trim(), _slug: s });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }
    if (orgId) {
      const result = await sendOrganizationCreatedEmail({ orgId });
      if (!result.sent) {
        console.warn("[email] Platform notification not sent:", result);
        toast.warning("Workspace created, but the platform admin was not emailed. Check SMTP settings and restart the dev server.");
      }
    }
    await refresh();
    toast.success("Agency workspace created");
    setSubmitting(false);
    navigate({ to: "/dashboard" });
  }

  async function joinAgency(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteToken.trim() || !user) return;
    setSubmitting(true);
    const { data: orgId, error } = await supabase.rpc("accept_organization_invite", { _token: inviteToken.trim() });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orgId) setActiveOrgId(orgId);
    await refresh();
    await linkMyEmployeeRecord();
    if (orgId && membership?.role) {
      const result = await sendMemberJoinedEmail({
        orgId,
        memberUserId: user.id,
        role: membership.role,
      });
      if (!result.sent) {
        console.warn("[email] Member joined notification not sent:", result);
      }
    }
    toast.success("Joined workspace");
    setSubmitting(false);
    navigate({ to: "/dashboard" });
  }

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border px-6 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-gradient-to-br from-brand to-brand/60 text-brand-foreground grid place-items-center text-sm font-bold">W</div>
          <span className="font-semibold">WorkPilot</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Set up your agency</h1>
            <p className="text-sm text-muted-foreground mt-1">Create a new workspace or join with the invite code from your email.</p>
          </div>

          <div className="flex rounded-lg border border-border p-1 bg-surface">
            <button onClick={() => setMode("create")} className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${mode === "create" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              Create agency
            </button>
            <button onClick={() => setMode("join")} className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${mode === "join" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              Join with invite
            </button>
          </div>

          {mode === "create" ? (
            <form onSubmit={createAgency} className="space-y-4 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="size-5 text-brand" />
                <p className="font-semibold">New agency workspace</p>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Agency name</span>
                <input required value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }}
                  placeholder="Acme Studio" className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">URL slug</span>
                <input required value={slug} onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="acme-studio" pattern="[a-z0-9-]+"
                  className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-brand" />
              </label>
              <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-brand text-brand-foreground font-semibold text-sm disabled:opacity-50">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <>Create workspace <ArrowRight className="size-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={joinAgency} className="space-y-4 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <KeyRound className="size-5 text-brand" />
                <p className="font-semibold">Join existing agency</p>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Invite code</span>
                <input required value={inviteToken} onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="Paste the code from your invite email"
                  className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-brand" />
              </label>
              <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-brand text-brand-foreground font-semibold text-sm disabled:opacity-50">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <>Join workspace <ArrowRight className="size-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
