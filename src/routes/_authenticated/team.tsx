import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { ROLE_LABEL } from "@/hooks/use-role";
import { fetchProfileEmails } from "@/lib/profile-emails";
import { isStaffRole } from "@/lib/users/member-scope";

type Member = {
  user_id: string;
  role: string;
  full_name: string | null;
  job_title: string | null;
  avatar_url: string | null;
  email: string | null;
};

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team · WorkPilot" }] }),
  component: TeamPage,
});

function TeamPage() {
  const { orgId, org } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("organization_members").select("user_id, role").eq("organization_id", orgId)
      .then(async ({ data }) => {
        const staff = (data ?? []).filter((m) => isStaffRole(m.role));
        const ids = staff.map((m) => m.user_id);
        if (!ids.length) { setMembers([]); return; }

        const [{ data: profs }, emailMap] = await Promise.all([
          supabase.from("profiles").select("id, full_name, job_title, avatar_url").in("id", ids),
          fetchProfileEmails(orgId, ids),
        ]);

        const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
        setMembers(staff.map((m) => ({
          user_id: m.user_id,
          role: m.role,
          full_name: profMap.get(m.user_id)?.full_name ?? null,
          job_title: profMap.get(m.user_id)?.job_title ?? null,
          avatar_url: profMap.get(m.user_id)?.avatar_url ?? null,
          email: emailMap.get(m.user_id) ?? null,
        })));
      });
  }, [orgId]);

  if (!orgId) return <AppShell title="Team"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  const subtitle = org
    ? `${org.name} · ${members.length} ${members.length === 1 ? "member" : "members"}`
    : `${members.length} members`;

  return (
    <AppShell title="Team" subtitle={subtitle}>
      {members.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <ProfileAvatar
                userId={m.user_id}
                name={m.full_name}
                avatarUrl={m.avatar_url}
                email={m.email}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.full_name ?? "Unnamed"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.job_title ?? ROLE_LABEL[m.role as keyof typeof ROLE_LABEL] ?? m.role}
                </p>
              </div>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                {ROLE_LABEL[m.role as keyof typeof ROLE_LABEL] ?? m.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
